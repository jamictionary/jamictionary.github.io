using System.Text.RegularExpressions;
using Humanizer;

namespace ScoresProcessor.Helpers;
public class MetadataBuilder(ScoresConfig config)
{
    // TODO: export all this data-configuration to a prominent place.
    //       In its own file, not here in the middle of the code and down by SeemsToHaveValue() etc...
    private static class Categories
    {
        // Keep synchronized with categories used in the frontend filter UI.
        private static readonly HashSet<string> All = [
            DanceGeometry,
            Country,
            TypeOfDance,
        ];

        public const string DanceGeometry = "Dance geometry";
        public const string Country = "Country";
        public const string TypeOfDance = "Type of dance";

        public static bool IsKnown(string category) => All.Contains(category, StringComparer.InvariantCultureIgnoreCase);
    }

    private record class Metadata(string Scores, string Categories);

    /// <summary>
    /// Generates and exports the metadata corresponding to the data in <paramref name="results"/>.
    /// </summary>
    public void ExportMetadataFor(IEnumerable<ExportedResult> results)
    {
        Metadata metadata = GenerateMetadataFor(results);
        File.WriteAllText(config.MetadataFileName, metadata.Scores, System.Text.Encoding.UTF8);
        File.WriteAllText(config.SearchCategoriesFileName, metadata.Categories, System.Text.Encoding.UTF8);
    }

    public static string? GetTypeOfDanceFor(TargetWithLabels target)
    {
        target.Labels.TryGetValue(Categories.TypeOfDance, out string? typeOfDance);
        return typeOfDance;
    }

    private Metadata GenerateMetadataFor(IEnumerable<ExportedResult> results)
    {
        string[] GetFolderStructureFor(Target item)
        {
            string relativeMsczPath = Path.GetRelativePath(config.JamictionaryDataFolder, item.Mscz);
            string dirName = Path.GetDirectoryName(relativeMsczPath)
                ?? throw new FolderException("Could not parse folder path into separate folder names.");
            string[] folders = dirName
                .Split(
                    [Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar],
                    StringSplitOptions.RemoveEmptyEntries
                );
            return folders
                // Ignore the first folder, "Danças portuguesas" / "Non-portuguese dances".
                .Skip(1)
                .ToArray();
        }
        object ProcessInfo(ExportedResult item, int index)
        {
            string[] folderStructure = GetFolderStructureFor(item.Source);
            var pages = item.ScoreImages.Select(score => Path.GetRelativePath(config.JamictionaryPublicFolder, score));

            // Get the dance geometry and type of dance for this score.
            item.Source.Labels.TryGetValue(Categories.DanceGeometry, out string? danceGeometry);
            item.Source.Labels.TryGetValue(Categories.TypeOfDance, out string? typeOfDance);

            var labels = item
                .Source
                .Labels
                .ToDictionary();

            return new
            {
                // We want indexed to 1, not to 0, as it will be user-facing: in the URL.
                number = index + 1,
                name = item.ScoreName,
                // searchableName is generated in frontend.

                pages,
                danceGeometry,
                typeOfDance,
                labels,

                files = new {
                    pdf = Path.Combine(ScoresConfig.TargetFolderName, $"{item.FilenameForExporting}.pdf"),
                    mscz = Path.Combine(ScoresConfig.TargetFolderName, $"{item.FilenameForExporting}.mscz"),
                },

                folderStructure,
            };
        }

        var scoresMetadata = results
                // Order scores alphabetically.
                .OrderBy(result => result.Mscz)
                .Select(ProcessInfo)
                .ToArray();
        var categoriesMetadata = results
            .SelectMany(item => item.Source.Labels)
            .Where(item => Categories.IsKnown(item.Key))
            .GroupBy(item => item.Key, item => item.Value, StringComparer.InvariantCultureIgnoreCase)
            .Select(group => new
            {
                // Each category has a name...
                name = group.Key,
                // ... and a set of values being used.
                values = group
                    // Order category values alphabetically.
                    .OrderBy(x => x, StringComparer.InvariantCultureIgnoreCase)
                    .Distinct(StringComparer.InvariantCultureIgnoreCase)
                    .ToArray(),
            });

        string scoresMetadataJson = JsonHelper.Serialize(scoresMetadata);
        string categoriesMetadataJson = JsonHelper.Serialize(categoriesMetadata);
        return new Metadata(scoresMetadataJson, categoriesMetadataJson);
    }

    public static Dictionary<string, string> ProcessLabels(IEnumerable<(string name, string value)> matches)
    {
        return matches
            .Where(SeemsToHaveValue)
            .ToDictionary(
                match => match.name.Humanize(LetterCasing.Sentence),
                match => HumanizeCategory(match.value)
                );
    }

    private static string HumanizeCategory(string value)
    {
        Regex separator = new(@",([^\s])");
        // Add a space after any comma that is not followed by a space.
        string corrected = separator.Replace(value, ", $1");
        return corrected;
    }

    // These labels/metaTags are of no interest to Jamictionary.
    private static readonly HashSet<string> LabelNamesToSkip = [
        "mscVersion",
        "platform",
        // No use in it. Last-update could be interesting, but not this.
        "creationDate",
    ];
    // These are found values that are in effect empty.
    private static readonly HashSet<string> PseudoEmptyValues = [
        ".....",
        "Template",
    ];
    // These are particular "placeholder" values that, while not being "foo: Foo", are equivalent to it.
    private static readonly Dictionary<string, string> KnownEmptyValues = new() {
        {"workTitle", "Title"},
    };
    private static bool SeemsToHaveValue((string name, string value) match)
    {
        // Ignore some labels such as "platform: Linux".
        if (LabelNamesToSkip.Contains(match.name))
        {
            return false;
        }
        // Filter empty.
        if (string.IsNullOrWhiteSpace(match.value))
        {
            return false;
        }
        if (PseudoEmptyValues.Contains(match.value))
        {
            return false;
        }
        // Filter pseudo-empty such as "composer: Composer".
        if (string.Equals(match.name, match.value, StringComparison.InvariantCultureIgnoreCase))
        {
            return false;
        }
        // Filter known pseudo-empty such as "workTitle: Title".
        if (KnownEmptyValues.TryGetValue(match.name, out string? toSkip)
            && toSkip.Equals(match.value, StringComparison.InvariantCultureIgnoreCase)
            )
        {
            return false;
        }
        return true;
    }
}
