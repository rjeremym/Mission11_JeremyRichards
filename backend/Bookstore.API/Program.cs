using Bookstore.API.Data;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.AzureAppServices;

var builder = WebApplication.CreateBuilder(args);

// Log stream / LogFiles: requires Portal "App Service logs" → Application Logging (Filesystem) = On.
builder.Logging.AddAzureWebAppDiagnostics();
builder.Services.Configure<AzureFileLoggerOptions>(options =>
{
    options.FileName = "azure-diagnostics-";
    options.FileSizeLimit = 50 * 1024 * 1024;
    options.RetainedFileCountLimit = 5;
});

// 1. Add services to the container.
builder.Services.AddControllers();

// 2. SQLite on Azure:
//    - Relative paths must be rooted at ContentRootPath (not process CWD).
//    - App Service often serves the app from a read-only mount (e.g. Run-From-Package). SQLite must open
//      read/write (journals/WAL) → use a writable copy under %HOME%\data when running on Azure.
static bool IsAzureAppService() =>
    !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("WEBSITE_INSTANCE_ID"));

static bool IsUnderDirectory(string filePath, string directory)
{
    var f = Path.GetFullPath(filePath).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
    var d = Path.GetFullPath(directory).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
    return f.StartsWith(d + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase)
        || string.Equals(f, d, StringComparison.OrdinalIgnoreCase);
}

static string CopySqliteToWritableDataFolder(string sourcePath)
{
    var home = Environment.GetEnvironmentVariable("HOME")
        ?? Environment.GetEnvironmentVariable("USERPROFILE")
        ?? Path.GetTempPath();
    var dir = Path.Combine(home, "data", "bookstore-sqlite");
    Directory.CreateDirectory(dir);
    var destPath = Path.Combine(dir, "Bookstore.sqlite");

    if (!File.Exists(destPath))
    {
        File.Copy(sourcePath, destPath, overwrite: false);
        return destPath;
    }

    var srcLen = new FileInfo(sourcePath).Length;
    var dstLen = new FileInfo(destPath).Length;
    var srcTime = File.GetLastWriteTimeUtc(sourcePath);
    var dstTime = File.GetLastWriteTimeUtc(destPath);
    if (srcTime > dstTime || srcLen != dstLen)
    {
        File.Copy(sourcePath, destPath, overwrite: true);
    }

    return destPath;
}

static string ResolveSqliteConnectionString(IConfiguration configuration, IHostEnvironment env)
{
    var configured = configuration.GetConnectionString("BookstoreConnection");
    var root = env.ContentRootPath;
    string fullPath;

    if (string.IsNullOrWhiteSpace(configured))
    {
        fullPath = Path.Combine(root, "Bookstore.sqlite");
    }
    else
    {
        const string prefix = "Data Source=";
        if (!configured.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
        {
            return configured;
        }

        var relativeOrAbsolute = configured[prefix.Length..].Trim();
        fullPath = Path.IsPathRooted(relativeOrAbsolute)
            ? relativeOrAbsolute
            : Path.Combine(root, relativeOrAbsolute);
    }

    fullPath = Path.GetFullPath(fullPath);

    if (IsAzureAppService()
        && File.Exists(fullPath)
        && IsUnderDirectory(fullPath, root))
    {
        fullPath = CopySqliteToWritableDataFolder(fullPath);
    }

    return $"Data Source={fullPath}";
}

var connectionString = ResolveSqliteConnectionString(
    builder.Configuration,
    builder.Environment);

builder.Services.AddDbContext<BookstoreContext>(options =>
    options.UseSqlite(connectionString));

// 3. Keep your CORS policy as is (AllowAnyOrigin is good for now)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

builder.Services.AddOpenApi();

var app = builder.Build();

var dbPathForLog = connectionString.StartsWith("Data Source=", StringComparison.OrdinalIgnoreCase)
    ? connectionString["Data Source=".Length..].Trim()
    : connectionString;
var startupLogger = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger("Bookstore.Startup");
startupLogger.LogInformation(
    "SQLite database path: {DatabasePath}. WEBSITE_INSTANCE_ID set: {OnAzure}",
    dbPathForLog,
    IsAzureAppService());

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler(errorApp =>
    {
        errorApp.Run(async context =>
        {
            var logger = errorApp.ApplicationServices.GetRequiredService<ILoggerFactory>()
                .CreateLogger("Bookstore.UnhandledException");
            var feature = context.Features.Get<IExceptionHandlerPathFeature>();
            logger.LogError(feature?.Error, "Unhandled exception on {Path}", feature?.Path);
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json; charset=utf-8";
            await context.Response.WriteAsJsonAsync(new { message = "An error occurred." });
        });
    });
    app.UseHttpsRedirection();
}

// OpenAPI document endpoint (must be registered on Azure too)
app.MapOpenApi();

app.UseCors("AllowFrontend");
app.UseAuthorization();
app.MapControllers();

app.Run();