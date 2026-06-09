<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $reportTitle }}</title>
    <style>
        @page {
            margin: 26px 28px 34px 28px;
        }

        body {
            font-family: DejaVu Sans, sans-serif;
            color: #162033;
            font-size: 10.8px;
            line-height: 1.55;
        }

        h1, h2, h3 {
            margin: 0 0 10px 0;
            color: #0f172a;
        }

        h1 {
            font-size: 24px;
        }

        h2 {
            font-size: 16px;
            border-bottom: 1px solid #d8e2f0;
            padding-bottom: 6px;
            margin-top: 18px;
        }

        h3 {
            font-size: 13px;
            margin-top: 12px;
        }

        p {
            margin: 0 0 10px 0;
        }

        ul, ol {
            margin: 0 0 10px 18px;
            padding: 0;
        }

        li {
            margin: 0 0 5px 0;
        }

        .cover {
            background: linear-gradient(135deg, #0f172a 0%, #173f73 58%, #f8fafc 58%, #ffffff 100%);
            color: #fff;
            padding: 28px;
            border-radius: 18px;
            min-height: 320px;
        }

        .cover h1,
        .cover h2,
        .cover p {
            color: #fff;
        }

        .panel {
            width: 58%;
        }

        .meta {
            margin-top: 18px;
            background: rgba(255, 255, 255, 0.12);
            border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 12px;
            padding: 14px 16px;
        }

        .chip {
            display: inline-block;
            padding: 4px 8px;
            margin: 0 6px 6px 0;
            border-radius: 999px;
            background: #e8f0ff;
            color: #1d4ed8;
            font-weight: bold;
            font-size: 10px;
        }

        .grid {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0 14px 0;
        }

        .grid th,
        .grid td {
            border: 1px solid #d8e2f0;
            padding: 8px;
            vertical-align: top;
            text-align: left;
        }

        .grid th {
            background: #eef4ff;
            color: #0f172a;
        }

        .callout {
            background: #f8fbff;
            border: 1px solid #d5e4ff;
            border-left: 4px solid #2563eb;
            border-radius: 10px;
            padding: 12px 14px;
            margin: 10px 0 12px 0;
        }

        .warning {
            background: #fff9ed;
            border-color: #f3d188;
            border-left-color: #d97706;
        }

        .page-break {
            page-break-before: always;
        }

        .small {
            font-size: 10px;
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="cover">
        <div class="panel">
            <div class="chip">Full Daily Report</div>
            <div class="chip">Development Progress</div>
            <div class="chip">{{ $reportDate }}</div>

            <h1>{{ $reportTitle }}</h1>
            <h2>{{ $appName }}</h2>

            <p style="font-size: 13px; margin-top: 16px;">
                Comprehensive daily project report covering technical work completed, affected modules,
                documentation updates, verification results, and recommended next actions.
            </p>

            <div class="meta">
                <p><strong>Project:</strong> {{ $appName }}</p>
                <p><strong>Company:</strong> {{ $companyName }}</p>
                <p><strong>Website:</strong> {{ $companyWebsite }}</p>
                <p><strong>Date:</strong> {{ $reportDate }}</p>
                <p><strong>Generated:</strong> {{ $generatedAt }}</p>
            </div>
        </div>
    </div>

    <h2>1. End-of-Day Summary</h2>
    <p>
        Today's work focused on making the project more complete, easier to understand, and easier to run after cloning.
        The work included schema/ERD verification, ERD regeneration from the live Laravel project, documentation alignment,
        onboarding automation improvements, new bootstrap scripts, Docker scaffolding, VS Code workflow improvements,
        and updated reporting output.
    </p>
    <div class="callout">
        <strong>Overall result:</strong><br>
        The repository is now in a stronger state for handover, GitHub pull, developer onboarding, and project explanation,
        while the application itself remains prepared through operational checks and a successful frontend production build.
    </div>

    <h2>2. Objectives Addressed Today</h2>
    <ul>
        @foreach ($objectives as $item)
            <li>{{ $item }}</li>
        @endforeach
    </ul>

    <h2>3. Work Completed By Area</h2>
    <table class="grid">
        <thead>
            <tr>
                <th>Area</th>
                <th>Completed Work</th>
                <th>Outcome</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($completedAreas as $row)
                <tr>
                    <td>{{ $row['area'] }}</td>
                    <td>{{ $row['work'] }}</td>
                    <td>{{ $row['outcome'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <h2>4. Detailed Technical Progress</h2>

    @foreach ($technicalSections as $section)
        <h3>{{ $section['title'] }}</h3>
        <ul>
            @foreach ($section['points'] as $point)
                <li>{{ $point }}</li>
            @endforeach
        </ul>
    @endforeach

    <div class="page-break"></div>

    <h2>5. Files Added or Updated</h2>
    <table class="grid">
        <thead>
            <tr>
                <th>File / Area</th>
                <th>Purpose</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($fileHighlights as $row)
                <tr>
                    <td>{{ $row['file'] }}</td>
                    <td>{{ $row['purpose'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <h2>6. Project State After Today's Work</h2>
    <table class="grid">
        <thead>
            <tr>
                <th>Topic</th>
                <th>Current State</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($stateSummary as $row)
                <tr>
                    <td>{{ $row['topic'] }}</td>
                    <td>{{ $row['state'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <h2>7. Verification Completed</h2>
    <table class="grid">
        <thead>
            <tr>
                <th>Verification Item</th>
                <th>Result</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($verification as $row)
                <tr>
                    <td>{{ $row['check'] }}</td>
                    <td>{{ $row['result'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <h2>8. Issues / Caveats</h2>
    <ul>
        @foreach ($caveats as $item)
            <li>{{ $item }}</li>
        @endforeach
    </ul>

    <div class="callout warning">
        <strong>Important note:</strong><br>
        Docker support has been added at the repository level, but Docker runtime validation could not be completed on this machine
        because Docker is not installed here.
    </div>

    <h2>9. Business / Documentation Impact</h2>
    <p>
        Beyond code changes, today's work improved the project's documentation quality and explainability. The ERD, wireframe notes,
        design notes, and README now align more closely with the live project state. This makes the system easier to present to a senior,
        easier to hand over to another developer, and easier to maintain over time.
    </p>
    <p>
        This is especially useful because the project is intended not only for internal use by Nextgen Technology, but also as a product
        that may be marketed to other departments or organizations in the future.
    </p>

    <div class="page-break"></div>

    <h2>10. Recommended Next Steps</h2>
    <ol>
        @foreach ($nextSteps as $step)
            <li>{{ $step }}</li>
        @endforeach
    </ol>

    <h2>11. Suggested Submission Summary</h2>
    <p>
        Today I completed a repository-readiness and documentation-alignment pass on the Nextgen Assets Management System.
        I regenerated the ERD from the live Laravel project, updated the wireframe and schema notes to match it, added bootstrap
        automation for easier cloning and setup, added Docker support files, improved VS Code workflow tasks, and rewrote the README
        to support office pull-and-run usage. I also rechecked the application with Laravel route checks and a successful frontend build.
    </p>

    <h2>12. Final Conclusion</h2>
    <p>
        Today's work moved the project forward in both technical quality and project usability. The application remains operational and verified,
        while the surrounding repository, documentation, and setup process are now more mature and easier for others to use.
    </p>

    <p class="small">
        Generated on {{ $generatedAt }} for daily progress reporting.
    </p>
</body>
</html>
