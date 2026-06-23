using System.Diagnostics;
using ParkMeBackend.Models;
using ParkMeBackend.Services;

namespace ParkMeBackend.Middleware;

public class ApiLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly DevLogStore _devLogStore;

    public ApiLoggingMiddleware(RequestDelegate next, DevLogStore devLogStore)
    {
        _next = next;
        _devLogStore = devLogStore;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!context.Request.Path.StartsWithSegments("/api"))
        {
            await _next(context);
            return;
        }

        var stopwatch = Stopwatch.StartNew();
        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();

            _devLogStore.AddLog(new DevLogEntry
            {
                Timestamp = DateTime.UtcNow,
                Endpoint = context.Request.Path.Value ?? string.Empty,
                StatusCode = context.Response.StatusCode,
                DurationMs = stopwatch.ElapsedMilliseconds,
            });
        }
    }
}