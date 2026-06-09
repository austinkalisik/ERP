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
            <div class="chip">Weekly Report</div>
            <div class="chip">Development Progress</div>
            <div class="chip">{{ $reportRange }}</div>

            <h1>{{ $reportTitle }}</h1>
            <h2>{{ $appName }}</h2>

            <p style="font-size: 13px; margin-top: 16px;">
                Weekly development report summarizing the major updates, fixes, feature work,
                documentation improvements, and repository improvements completed during the reporting period.
            </p>

            <div class="meta">
                <p><strong>Project:</strong> {{ $appName }}</p>
                <p><strong>Company:</strong> {{ $companyName }}</p>
                <p><strong>Website:</strong> {{ $companyWebsite }}</p>
                <p><strong>Reporting Period:</strong> {{ $reportRange }}</p>
                <p><strong>Generated:</strong> {{ $generatedAt }}</p>
            </div>
        </div>
    </div>

    <h2>1. Weekly Executive Summary</h2>
    <p>
        During the reporting period, work on the Nextgen Assets Management System focused on stabilizing the user experience,
        improving login and startup reliability, strengthening feature completeness, improving inventory logic, aligning system
        branding with Nextgen Technology, expanding reporting/documentation, and making the repository easier to clone and run.
    </p>
    <div class="callout">
        <strong>Weekly result:</strong><br>
        The system became more usable, better documented, easier to explain, and easier for another developer to pull and run,
        while keeping core functionality checked for office use with a successful frontend build.
    </div>

    <h2>2. Weekly Objectives Achieved</h2>
    <ul>
        @foreach ($objectives as $item)
            <li>{{ $item }}</li>
        @endforeach
    </ul>

    <h2>3. Weekly Work Summary</h2>
    <table class="grid">
        <thead>
            <tr>
                <th>Area</th>
                <th>Main Work Completed</th>
                <th>Outcome</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($summaryRows as $row)
                <tr>
                    <td>{{ $row['area'] }}</td>
                    <td>{{ $row['work'] }}</td>
                    <td>{{ $row['outcome'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="page-break"></div>

    <h2>4. Detailed Weekly Breakdown</h2>
    @foreach ($sections as $section)
        <h3>{{ $section['title'] }}</h3>
        <ul>
            @foreach ($section['points'] as $point)
                <li>{{ $point }}</li>
            @endforeach
        </ul>
    @endforeach

    <h2>5. Major Features and Improvements Delivered</h2>
    <table class="grid">
        <thead>
            <tr>
                <th>Category</th>
                <th>Delivered Improvement</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($deliverables as $row)
                <tr>
                    <td>{{ $row['category'] }}</td>
                    <td>{{ $row['item'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <h2>6. Documentation and Repository Improvements</h2>
    <ul>
        @foreach ($repoDocs as $item)
            <li>{{ $item }}</li>
        @endforeach
    </ul>

    <div class="page-break"></div>

    <h2>7. Verification and Quality Checks</h2>
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

    <h2>8. Weekly Status Assessment</h2>
    <table class="grid">
        <thead>
            <tr>
                <th>Topic</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($statusRows as $row)
                <tr>
                    <td>{{ $row['topic'] }}</td>
                    <td>{{ $row['status'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <h2>9. Risks / Outstanding Items</h2>
    <ul>
        @foreach ($risks as $item)
            <li>{{ $item }}</li>
        @endforeach
    </ul>

    <div class="callout warning">
        <strong>Important weekly note:</strong><br>
        The repository is much easier to clone and run now, but full production deployment still requires standard infrastructure work
        such as HTTPS, real mail configuration, server/process setup, and Docker runtime validation on a Docker-enabled machine.
    </div>

    <h2>10. Recommended Next Week Actions</h2>
    <ol>
        @foreach ($nextSteps as $item)
            <li>{{ $item }}</li>
        @endforeach
    </ol>

    <h2>11. Weekly Conclusion</h2>
    <p>
        Across this reporting period, the project improved in stability, usability, branding clarity, documentation quality,
        schema transparency, and developer onboarding readiness. The work completed this week strengthened both the application itself
        and the surrounding project materials needed for office handover and future maintenance.
    </p>

    <p class="small">
        Generated on {{ $generatedAt }} for weekly reporting purposes.
    </p>
</body>
</html>
