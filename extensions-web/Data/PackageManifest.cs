using System.Xml.Serialization;

[XmlRoot("PackageManifest", Namespace = "http://schemas.microsoft.com/developer/vsx-schema/2011")]
public class ExtensionManifest
{
    [XmlElement("Metadata")]
    public Metadata Metadata { get; set; }
    [XmlArray("Assets")]
    [XmlArrayItem("Asset")]
    public List<Asset>? Assets { get; set; }
    public string Identifier => $"{Metadata.Identity.Publisher}.{Metadata.Identity.Id}";
    public bool IsPreRelease { get; set; }
    public string Version => Metadata.Identity.Version;
    public string Target => Metadata.Identity.TargetPlatform ?? "Any";
    public string[] Categories => Metadata.CategoryString.Split(',');
    public string DisplayName => Metadata.DisplayName ?? Identifier;
    public string? Description => Metadata.Description;
    public string? RelativeIconPath => Assets?.FirstOrDefault(a => a.AssetType == "Microsoft.VisualStudio.Services.Icons.Default")?.Path;
    public string? RelativeReadmePath => Assets?.FirstOrDefault(a => a.AssetType == "Microsoft.VisualStudio.Services.Content.Details")?.Path;
}

public class Metadata
{
    [XmlElement("Identity")]
    public Identity Identity { get; set; } = new Identity();

    [XmlElement("DisplayName")]
    public string? DisplayName { get; set; }

    [XmlElement("Categories")]
    public string CategoryString { get; set; } = string.Empty;

    [XmlElement("Description")]
    public string? Description { get; set; }

}

public class Identity
{
    [XmlAttribute("Id")]
    public string Id { get; set; } = string.Empty;

    [XmlAttribute("Version")]
    public string Version { get; set; } = string.Empty;

    [XmlAttribute("Publisher")]
    public string Publisher { get; set; } = string.Empty;

    [XmlAttribute("TargetPlatform")]
    public string TargetPlatform { get; set; } = string.Empty;
}

public class Asset
{
    [XmlAttribute("Type")]
    public string? AssetType { get; set; }

    [XmlAttribute("Path")]
    public string? Path { get; set; }
}