namespace API.Endpoints;

public static class ApiRoute
{
    public const string ApiBasePattern = "api";
    public const string ApiBasePath = "/api";

    public const string Health = "/health";
    public const string OpenApiDocument = "/openapi/v1.json";
    public const string CorsPolicy = "AllowUI";

    public static class Auth
    {
        public const string Pattern = $"{ApiBasePattern}/auth";
        public const string Path = $"{ApiBasePath}/auth";

        public const string Register = "register";
        public const string Login = "login";
        public const string Logout = "logout";
        public const string Me = "me";

        public const string RegisterPath = $"{Path}/{Register}";
        public const string LoginPath = $"{Path}/{Login}";
        public const string LogoutPath = $"{Path}/{Logout}";
        public const string MePath = $"{Path}/{Me}";
    }

    public static class Tour
    {
        public const string Pattern = $"{ApiBasePattern}/tour";
        public const string Path = $"{ApiBasePath}/tour";
        public const string Search = "search";

        public static string ById(Guid id) => $"{Path}/{id}";

        public static string SearchByText(string searchText) => $"{Path}/{Search}/{searchText}";
    }

    public static class TourLog
    {
        public const string Pattern = $"{ApiBasePattern}/tourlog";
        public const string Path = $"{ApiBasePath}/tourlog";
        public const string ByTour = "bytour";

        public static string ById(Guid id) => $"{Path}/{id}";

        public static string ByTourId(Guid tourId) => $"{Path}/{ByTour}/{tourId}";
    }

    public static class Routes
    {
        public const string Pattern = $"{ApiBasePattern}/routes";
        public const string Path = $"{ApiBasePath}/routes";
        public const string Resolve = "resolve";
        public const string ResolvePath = $"{Path}/{Resolve}";
    }

    public static class Reports
    {
        public const string Pattern = $"{ApiBasePattern}/reports";
        public const string Path = $"{ApiBasePath}/reports";
        public const string Summary = "summary";
        public const string TourReport = "tour";
        public const string Export = "export";
        public const string Import = "import";

        public const string SummaryPath = $"{Path}/{Summary}";
        public const string ImportPath = $"{Path}/{Import}";

        public static string TourById(Guid tourId) => $"{Path}/{TourReport}/{tourId}";

        public static string ExportById(Guid tourId) => $"{Path}/{Export}/{tourId}";
    }
}

public static class ApiTag
{
    public const string Auth = "Auth";
    public const string Routes = "Routes";
    public const string Reports = "Reports";
}
