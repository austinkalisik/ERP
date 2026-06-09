<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $reportTitle }}</title>
    <style>
        @page {
            margin: 28px 28px 36px 28px;
        }

        body {
            font-family: DejaVu Sans, sans-serif;
            color: #162033;
            font-size: 11px;
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

        ul {
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
            min-height: 300px;
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

        .small {
            font-size: 10px;
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="cover">
        <div class="panel">
            <div class="chip">Daily Report</div>
            <div class="chip">Development Progress</div>
            <div class="chip">{{ $reportDate }}</div>

            <h1>{{ $reportTitle }}</h1>
            <h2>{{ $appName }}</h2>

            <p style="font-size: 13px; margin-top: 16px;">
                Daily development summary for {{ $companyName }}, covering completed work,
                technical improvements, verification results, and next recommended actions.
            </p>

            <div class="meta">
                <p><strong>Prepared For:</strong> Daily progress submission</p>
                <p><strong>Project:</strong> {{ $appName }}</p>
                <p><strong>Company:</strong> {{ $companyName }}</p>
                <p><strong>Website:</strong> {{ $companyWebsite }}</p>
                <p><strong>Generated:</strong> {{ $generatedAt }}</p>
            </div>
        </div>
    </div>

    <h2>1. Executive Summary</h2>
    <p>
        Work completed today focused on improving project readiness, documentation alignment,
        and onboarding simplicity for the Nextgen Assets Management System. The system's ERD was regenerated
        from the live schema, wireframe notes were synchronized with the generated ERD, and the repository
        was improved so it is easier to clone, bootstrap, verify, and run in VS Code.
    </p>
    <div class="callout">
        <strong>Short summary:</strong><br>
        Today's work improved documentation accuracy, setup automation, and repository usability while keeping the
        application in a verified working state.
    </div>

    <h2>2. Main Tasks Completed Today</h2>
    <table class="grid">
        <thead>
            <tr>
                <th>Work Area</th>
                <th>Completed Outcome</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($completedWork as $row)
                <tr>
                    <td>{{ $row['area'] }}</td>
                    <td>{{ $row['outcome'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <h2>3. Detailed Progress Notes</h2>

    <h3>3.1 ERD Regeneration and Alignment</h3>
    <ul>
        <li>`graph.png` was regenerated from the live project using `php artisan generate:erd`.</li>
        <li>A text snapshot of the generated ERD was created as `wireframe/erd-current.txt`.</li>
        <li>The ERD explanation notes were rewritten so they now match the generated ERD context.</li>
        <li>Schema alignment notes were added to explain the difference between live generated output and idealized business documentation.</li>
    </ul>

    <h3>3.2 Wireframe and Documentation Synchronization</h3>
    <ul>
        <li>The wireframe notes were updated to reference the generated ERD instead of older assumptions.</li>
        <li>The documentation now explains that the project is a Laravel + ReactJS CRUD application.</li>
        <li>The notes now acknowledge live schema realities such as legacy columns still visible in the generated ERD.</li>
    </ul>

    <h3>3.3 Clone-and-Run Improvements</h3>
    <ul>
        <li>Added a true bootstrap flow so a developer can run `composer run bootstrap` after cloning.</li>
        <li>Bootstrap now handles dependency installation, `.env` creation, app key generation, storage linking, migrations, seeders, cache clear, and frontend build.</li>
        <li>Added Windows PowerShell and shell helper scripts for easier setup across environments.</li>
    </ul>

    <h3>3.4 VS Code and Docker Readiness</h3>
    <ul>
        <li>VS Code tasks were updated to include bootstrap and verification commands.</li>
        <li>Docker support files were added, including `Dockerfile`, `docker-compose.yml`, Docker environment example, and Apache entrypoint configuration.</li>
        <li>The README was rewritten to provide clear clone, bootstrap, Docker, and verification instructions.</li>
    </ul>

    <h2>4. Files Added or Updated</h2>
    <table class="grid">
        <thead>
            <tr>
                <th>File</th>
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

    <h2>5. Verification Completed</h2>
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

    <h2>6. Current Status</h2>
    <p>
        The repository is now in a much better state for onboarding and GitHub-based reuse. A developer can follow
        a clearer documented path, use the new bootstrap command, run the included VS Code tasks, and use Docker
        as an additional startup option.
    </p>
    <p>
        The application is not being presented as fully production-hardened infrastructure, but it is now significantly
        easier to clone, understand, and run than before.
    </p>

    <h2>7. Remaining Caveats</h2>
    <ul>
        @foreach ($caveats as $item)
            <li>{{ $item }}</li>
        @endforeach
    </ul>

    <h2>8. Recommended Next Steps</h2>
    <ol>
        @foreach ($nextSteps as $step)
            <li>{{ $step }}</li>
        @endforeach
    </ol>

    <h2>9. End-of-Day Conclusion</h2>
    <p>
        Today's work strengthened the project in three important ways: documentation accuracy, setup automation,
        and repository usability. The ERD and wireframe notes are now aligned, the setup process is much easier for
        future maintainers, and the project remains prepared through operational checks and a successful production build.
    </p>

    <p class="small">
        Generated on {{ $generatedAt }} for daily reporting purposes.
    </p>
</body>
</html>
