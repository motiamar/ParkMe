using ParkMeBackend.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddControllers();
builder.Services.AddScoped<ParkingLotService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        // Allow both 5173 (Vite default) and 5175 (fallback if 5173 is taken).
        // Vite is configured to use 5173 with strictPort, but listing both prevents
        // a silent CORS failure if the port ever changes during development.
        policy.WithOrigins("http://localhost:5173", "http://localhost:5175")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// UseHttpsRedirection is disabled in development because the browser rejects
// the self-signed dev certificate, causing fetch() to silently fail with
// "Failed to fetch". Re-enable this when deploying to a real HTTPS server.
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("AllowFrontend");
app.MapControllers();

app.Run();
