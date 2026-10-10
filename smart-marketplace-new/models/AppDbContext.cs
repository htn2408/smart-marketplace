using Microsoft.EntityFrameworkCore;

namespace smart_marketplace_new.models;

// EF Core DbContext ánh xạ đúng schema MySQL đã có (smart_marketplace),
// khớp với prisma/schema.prisma và bản dump Dump20260922 (2).sql.
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<WorkerProfile> WorkerProfiles => Set<WorkerProfile>();
    public DbSet<SkillCategory> SkillCategories => Set<SkillCategory>();
    public DbSet<Skill> Skills => Set<Skill>();
    public DbSet<WorkerSkill> WorkerSkills => Set<WorkerSkill>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<TaskImage> TaskImages => Set<TaskImage>();
    public DbSet<Invoice> Invoices => Set<Invoice>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // ---- users ----
        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.HasIndex(u => u.PhoneNumber).IsUnique();

            // role lưu dạng chuỗi khớp cột ENUM('CLIENT','WORKER') của MySQL,
            // balance mặc định 1.000.000 VNĐ phía DB
            e.Property(u => u.Role).HasConversion<string>().HasDefaultValue(Role.CLIENT);
            e.Property(u => u.Balance).HasDefaultValue(1000000.00m);
            e.Property(u => u.HeldBalance).HasDefaultValue(0.00m);

            // Client 1-n Task
            e.HasMany(u => u.TasksPosted)
                .WithOne(t => t.Client)
                .HasForeignKey(t => t.ClientId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ---- worker_profiles ----
        modelBuilder.Entity<WorkerProfile>(e =>
        {
            // 1-1 User - WorkerProfile (user_id unique)
            e.HasIndex(w => w.UserId).IsUnique();

            e.HasOne(w => w.User)
                .WithOne(u => u.WorkerProfile)
                .HasForeignKey<WorkerProfile>(w => w.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasMany(w => w.TasksAccepted)
                .WithOne(t => t.WorkerProfile!)
                .HasForeignKey(t => t.WorkerProfileId)
                .OnDelete(DeleteBehavior.SetNull);

            e.Property(w => w.Rating).HasDefaultValue(5.00m);
            e.Property(w => w.CompletedTasks).HasDefaultValue(0);
        });

        // ---- skill_categories ----
        modelBuilder.Entity<SkillCategory>(e =>
        {
            e.HasIndex(c => c.Name).IsUnique();
        });

        // ---- skills ----
        modelBuilder.Entity<Skill>(e =>
        {
            e.HasIndex(s => s.Name).IsUnique();

            e.HasOne(s => s.Category)
                .WithMany(c => c.Skills)
                .HasForeignKey(s => s.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ---- worker_skills (PK tổng hợp) ----
        modelBuilder.Entity<WorkerSkill>(e =>
        {
            e.HasKey(ws => new { ws.WorkerProfileId, ws.SkillId });

            e.HasOne(ws => ws.WorkerProfile)
                .WithMany(w => w.Skills)
                .HasForeignKey(ws => ws.WorkerProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(ws => ws.Skill)
                .WithMany(s => s.Workers)
                .HasForeignKey(ws => ws.SkillId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ---- tasks ----
        modelBuilder.Entity<TaskItem>(e =>
        {
            // enum MySQL, status mặc định PENDING
            e.Property(t => t.Status).HasConversion<string>().HasDefaultValue(TaskItemStatus.PENDING);

            e.HasOne(t => t.RequiredSkill)
                .WithMany(s => s.Tasks)
                .HasForeignKey(t => t.RequiredSkillId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasMany(t => t.Images)
                .WithOne(i => i.Task!)
                .HasForeignKey(i => i.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(t => t.Invoice)
                .WithOne(i => i.Task!)
                .HasForeignKey<Invoice>(i => i.TaskId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ---- task_images ----
        // (quan hệ + FK đã khai báo trong TaskItem)

        // ---- invoices ----
        modelBuilder.Entity<Invoice>(e =>
        {
            e.HasIndex(i => i.TaskId).IsUnique();
            e.Property(i => i.Status).HasConversion<string>().HasDefaultValue(InvoiceStatus.PENDING);
        });
    }
}
