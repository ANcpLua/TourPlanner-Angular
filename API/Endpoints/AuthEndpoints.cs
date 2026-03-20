using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;

namespace API.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var auth = endpoints.MapGroup("/api/auth").WithTags("Auth");
        auth.MapPost("/register", Register);
        auth.MapPost("/login", Login);
        auth.MapPost("/logout", Logout).RequireAuthorization();
        auth.MapGet("/me", Me).RequireAuthorization();
        return endpoints;
    }

    private static async Task<Results<Ok, ValidationProblem>> Register(
        RegisterRequest request,
        UserManager<IdentityUser> userManager)
    {
        var user = new IdentityUser { UserName = request.Email, Email = request.Email };
        var result = await userManager.CreateAsync(user, request.Password);

        if (result.Succeeded) return TypedResults.Ok();

        var errors = result.Errors
            .GroupBy(static e => e.Code)
            .ToDictionary(static g => g.Key, static g => g.Select(static e => e.Description).ToArray());

        return TypedResults.ValidationProblem(errors);
    }

    private static async Task<Results<Ok<UserInfo>, UnauthorizedHttpResult>> Login(
        LoginRequest request,
        SignInManager<IdentityUser> signInManager,
        UserManager<IdentityUser> userManager)
    {
        var result = await signInManager.PasswordSignInAsync(
            request.Email, request.Password, isPersistent: true, lockoutOnFailure: false);

        if (!result.Succeeded) return TypedResults.Unauthorized();

        var user = await userManager.FindByEmailAsync(request.Email);
        return TypedResults.Ok(new UserInfo(user!.Id, user.Email!));
    }

    private static async Task<Ok> Logout(SignInManager<IdentityUser> signInManager)
    {
        await signInManager.SignOutAsync();
        return TypedResults.Ok();
    }

    private static async Task<Results<Ok<UserInfo>, UnauthorizedHttpResult>> Me(
        HttpContext httpContext,
        UserManager<IdentityUser> userManager)
    {
        var user = await userManager.GetUserAsync(httpContext.User);
        if (user is null) return TypedResults.Unauthorized();
        return TypedResults.Ok(new UserInfo(user.Id, user.Email!));
    }
}

public sealed record RegisterRequest(
    [Required] string Email,
    [Required] string Password);

public sealed record LoginRequest(
    [Required] string Email,
    [Required] string Password);

public sealed record UserInfo(string Id, string Email);
