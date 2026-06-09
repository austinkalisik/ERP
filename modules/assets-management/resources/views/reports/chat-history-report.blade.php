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

        h1 { font-size: 24px; }

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
            width: 60%;
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
            <div class="chip">Full Chat Report</div>
            <div class="chip">Development Timeline</div>
            <div class="chip">{{ $reportDate }}</div>

            <h1>{{ $reportTitle }}</h1>
            <h2>{{ $appName }}</h2>

            <p style="font-size: 13px; margin-top: 16px;">
                Complete progress report covering all major system updates requested and completed
                from the beginning of this chat up to the latest repository and documentation work.
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

    <h2>1. Executive Summary</h2>
    <p>
        From the beginning of this chat to the latest update, work covered system startup issues, login fixes,
        branding updates, performance tuning, backend hardening, notification settings implementation, depreciation,
        inventory deletion fixes, UI modernization, ERD alignment, developer onboarding improvements, Docker scaffolding,
        and reporting/documentation enhancements.
    </p>
    <div class="callout">
        <strong>Overall result:</strong><br>
        The Nextgen Assets Management System became more stable, more explainable, easier to run, easier to present,
        and easier for another developer to pull from GitHub and start working on.
    </div>

    <h2>2. Full Timeline of Work Completed</h2>
    <table class="grid">
        <thead>
            <tr>
                <th>Phase</th>
                <th>Work Completed</th>
                <th>Outcome</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($timeline as $row)
                <tr>
                    <td>{{ $row['phase'] }}</td>
                    <td>{{ $row['work'] }}</td>
                    <td>{{ $row['outcome'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="page-break"></div>

    <h2>3. Detailed Breakdown By Area</h2>
    @foreach ($sections as $section)
        <h3>{{ $section['title'] }}</h3>
        <ul>
            @foreach ($section['points'] as $point)
                <li>{{ $point }}</li>
            @endforeach
        </ul>
    @endforeach

    <h2>4. Key Features and Improvements Delivered During This Chat</h2>
    <table class="grid">
        <thead>
            <tr>
                <th>Area</th>
                <th>Delivered Change</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($deliverables as $row)
                <tr>
                    <td>{{ $row['area'] }}</td>
                    <td>{{ $row['change'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <h2>5. Documentation and Project Structure Work</h2>
    <ul>
        @foreach ($docsWork as $item)
            <li>{{ $item }}</li>
        @endforeach
    </ul>

    <div class="page-break"></div>

    <h2>6. Repository and Developer Experience Improvements</h2>
    <ul>
        @foreach ($devex as $item)
            <li>{{ $item }}</li>
        @endforeach
    </ul>

    <h2>7. Verification Performed</h2>
    <table class="grid">
        <thead>
            <tr>
                <th>Check</th>
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

    <h2>8. Current Project Position</h2>
    <p>
        At the end of this chat, the system is in a stronger development and handover position than it was at the start.
        The application has improved usability, clearer branding, better documentation, stronger setup automation, and a more
        accurate ERD/documentation trail. The repository is easier to explain to management and easier to clone for development.
    </p>

    <h2>9. Remaining Caveats</h2>
    <ul>
        @foreach ($caveats as $item)
            <li>{{ $item }}</li>
        @endforeach
    </ul>

    <h2>10. Recommended Next Steps</h2>
    <ol>
        @foreach ($nextSteps as $item)
            <li>{{ $item }}</li>
        @endforeach
    </ol>

    <h2>11. End-of-Chat Closing Summary</h2>
    <p>
        This chat delivered both system improvements and project readiness improvements. The work began with login, connectivity,
        and usability fixes, then expanded into real feature implementation, UI upgrades, schema/ERD alignment, onboarding automation,
        and daily reporting support. The result is a more mature and presentation-ready version of the Nextgen Assets Management System.
    </p>

    <p class="small">
        Generated on {{ $generatedAt }} as a complete chat-history progress report.
    </p>
</body>
</html>
