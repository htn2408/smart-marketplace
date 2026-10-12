using smart_marketplace_new.dto;

namespace smart_marketplace_new.services;

public interface IServiceCategoryService
{
    Task<List<CategoryDto>> GetCategoriesAsync(CancellationToken ct = default);
    Task<CategoryDto> GetCategoryByIdAsync(string id, CancellationToken ct = default);
}
