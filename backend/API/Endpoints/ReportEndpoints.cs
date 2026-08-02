using System.Diagnostics;
using System.Text;
using API.Transport;
using BL.DomainModel;
using BL.Interfaces;
using Contracts.Reports;
using Contracts.Tours;
using MapsterMapper;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace API.Endpoints;

public static class ReportEndpoints
{
    private const string XmlContentType = "application/xml";

    public static IEndpointRouteBuilder MapReportEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var reports = endpoints.MapGroup(ApiRoute.Reports.Path).WithTags(ApiTag.Reports);
        reports.MapGet(ApiRoute.Reports.Summary, GetSummaryReport);
        reports.MapGet($"{ApiRoute.Reports.TourReport}/{{tourId:guid}}", GetTourReport);
        reports.MapGet($"{ApiRoute.Reports.Export}/{{tourId:guid}}", ExportTourToXml)
            .Produces<string>(StatusCodes.Status200OK, contentType: XmlContentType)
            .Produces(StatusCodes.Status404NotFound);
        reports.MapPost(ApiRoute.Reports.Import, ImportTourFromXmlAsync)
            .Accepts<ImportTourRequest>("application/json")
            .Produces<TourDto>(StatusCodes.Status201Created, "application/json")
            .ProducesValidationProblem(StatusCodes.Status400BadRequest);
        return endpoints;
    }

    internal static FileContentHttpResult GetSummaryReport(
        IPdfReportService pdfReportService,
        ITourService tourService)
    {
        var report = pdfReportService.GenerateSummaryReport(tourService.GetAllTours());
        return TypedResults.File(report, "application/pdf", "SummaryReport.pdf");
    }

    internal static Results<FileContentHttpResult, NotFound> GetTourReport(
        Guid tourId,
        ITourService tourService,
        IPdfReportService pdfReportService)
    {
        var tour = tourService.GetTourById(tourId);
        return tour is null
            ? TypedResults.NotFound()
            : TypedResults.File(
                pdfReportService.GenerateTourReport(tour),
                "application/pdf",
                $"TourReport_{tourId}.pdf");
    }

    internal static Results<ContentHttpResult, NotFound> ExportTourToXml(
        Guid tourId,
        ITourService tourService)
    {
        if (tourService.GetTourById(tourId) is not { } tour)
            return TypedResults.NotFound();

        var xml = ToXmlDocument(tour).WriteToXml();
        return TypedResults.Content(xml, XmlContentType, Encoding.UTF8);
    }

    internal static async Task<Results<Created<TourDto>, ValidationProblem>> ImportTourFromXmlAsync(
        [FromBody] ImportTourRequest request,
        ITourService tourService,
        IMapper mapper,
        CancellationToken cancellationToken)
    {
        var parseResult = TourXmlParser.Parse(request.Xml);
        if (parseResult is TourXmlParseResult.Invalid invalid)
        {
            return TypedResults.ValidationProblem(
                new Dictionary<string, string[]>
                {
                    [nameof(ImportTourRequest.Xml)] = [invalid.Error]
                });
        }

        var document = ((TourXmlParseResult.Parsed)parseResult).Document;
        var createdTour = await tourService.CreateTourAsync(ToDomain(document), cancellationToken);
        return TypedResults.Created(
            ApiRoute.Tour.ById(createdTour.Id),
            mapper.Map<TourDto>(createdTour));
    }

    private static TourXmlDocument ToXmlDocument(TourDomain tour) => new()
    {
        Name = tour.Name,
        Description = tour.Description,
        From = tour.From,
        To = tour.To,
        ImagePath = tour.ImagePath,
        RouteInformation = tour.RouteInformation,
        Distance = tour.Distance,
        EstimatedTime = tour.EstimatedTime,
        TransportType = tour.TransportType,
        TourLogs =
        [
            .. tour.Logs.Select(static log => new TourLogXmlItem
            {
                DateTime = log.DateTime,
                Comment = log.Comment,
                Difficulty = log.Difficulty,
                TotalDistance = log.TotalDistance,
                TotalTime = log.TotalTime,
                Rating = log.Rating
            })
        ]
    };

    private static TourDomain ToDomain(TourXmlDocument document) => new()
    {
        Id = Guid.Empty,
        Name = document.Name,
        Description = document.Description,
        From = document.From,
        To = document.To,
        ImagePath = document.ImagePath,
        RouteInformation = document.RouteInformation,
        Distance = document.Distance,
        EstimatedTime = document.EstimatedTime,
        TransportType = document.TransportType,
        Logs =
        [
            .. document.TourLogs.Select(ToDomain)
        ]
    };

    private static TourLogDomain ToDomain(TourLogXmlItem log)
    {
        if (log is not
            {
                Difficulty: { } difficulty,
                TotalDistance: { } totalDistance,
                TotalTime: { } totalTime,
                Rating: { } rating
            })
            throw new UnreachableException("Parsed tour logs always contain validated numeric values.");

        return new TourLogDomain
        {
            Id = Guid.Empty,
            TourDomainId = Guid.Empty,
            DateTime = log.DateTime,
            Comment = log.Comment,
            Difficulty = difficulty,
            TotalDistance = totalDistance,
            TotalTime = totalTime,
            Rating = rating
        };
    }
}
