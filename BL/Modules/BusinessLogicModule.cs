using Autofac;
using BL.Interfaces;
using BL.Service;
using Microsoft.Extensions.Configuration;

namespace BL.Modules;

public class BusinessLogicModule(IConfiguration configuration) : Autofac.Module
{
    protected override void Load(ContainerBuilder builder)
    {
        builder.RegisterType<RouteService>().As<IRouteService>().InstancePerLifetimeScope();
        builder.RegisterType<TourService>().As<ITourService>().InstancePerLifetimeScope();
        builder.RegisterType<TourLogService>().As<ITourLogService>().InstancePerLifetimeScope();
        builder.RegisterType<FileService>().As<IFileService>().InstancePerLifetimeScope();

        builder
            .RegisterType<PdfReportService>()
            .As<IPdfReportService>()
            .WithParameter(
                "imageBasePath",
                configuration["AppSettings:ImageBasePath"] ?? ""
            )
            .InstancePerLifetimeScope();
    }
}
