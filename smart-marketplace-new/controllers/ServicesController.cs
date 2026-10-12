using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using smart_marketplace_new.dto;
using smart_marketplace_new.services;

namespace smart_marketplace_new.controllers;

[ApiController]
[Route("api/services")]
public class ServicesController(IServiceCategoryService serviceCategories) : ControllerBase
{
    [HttpGet("categories")]
    [AllowAnonymous]
    public async Task<ActionResult<List<CategoryDto>>> GetCategories(CancellationToken ct)
    {
        return Ok(await serviceCategories.GetCategoriesAsync(ct));
    }

    [HttpGet("categories/{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<CategoryDto>> GetCategoryById(string id, CancellationToken ct)
    {
        return Ok(await serviceCategories.GetCategoryByIdAsync(id, ct));
    }
}
