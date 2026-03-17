using BL.DomainModel;

namespace BL.Interfaces;

public interface IPdfReportService
{
    byte[] GenerateTourReport(TourDomain tour);
    byte[] GenerateSummaryReport(IEnumerable<TourDomain> tours);
}