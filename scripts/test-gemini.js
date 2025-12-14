async function main() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.log("No API Key");
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const res = await fetch(url);
        if (!res.ok) {
            const text = await res.text();
            console.log(`HTTP ${res.status} ${res.statusText}`);
            console.log("Response:", text.substring(0, 500)); // Limit output
        } else {
            const data = await res.json();
            console.log("Success! Models found:", data.models?.length);
            const names = data.models?.map(m => m.name) || [];
            console.log("---BEGIN MODELS---");
            console.log(names.join("\n"));
            console.log("---END MODELS---");
        }
    } catch (e) {
        console.error("Fetch error:", e.message);
    }
}

main();
