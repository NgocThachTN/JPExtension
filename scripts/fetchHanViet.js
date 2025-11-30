const fs = require('fs');
const path = require('path');
const https = require('https');

const url = 'https://raw.githubusercontent.com/ph0ngp/hanviet-pinyin-wordlist/master/hanviet.csv';
const outputPath = path.join(__dirname, '../public/dict/hanviet.json');

// Ensure directory exists
const dir = path.dirname(outputPath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

console.log('Downloading Han Viet dictionary...');

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Download complete. Parsing...');

        const lines = data.split('\n');
        const dictionary = {};

        lines.forEach(line => {
            if (!line.trim()) return;
            // CSV format: char,hanviet,pinyin
            // Note: Some lines might have commas in quotes, but for single chars it should be fine.
            // Simple split by comma
            const parts = line.split(',');
            if (parts.length >= 2) {
                const char = parts[0].trim();
                const hanviet = parts[1].trim();

                // Only take single characters (Kanji)
                if (char.length === 1) {
                    // Handle multiple readings if any (though this CSV seems to have one per line or duplicates)
                    // If duplicate, we can append or ignore. Let's just overwrite for now or keep first.
                    if (!dictionary[char]) {
                        dictionary[char] = hanviet;
                    } else {
                        // If already exists, maybe append? e.g. "NHẬT, NHỰT"
                        if (!dictionary[char].includes(hanviet)) {
                            dictionary[char] += `, ${hanviet}`;
                        }
                    }
                }
            }
        });

        fs.writeFileSync(outputPath, JSON.stringify(dictionary, null, 2));
        console.log(`Saved dictionary to ${outputPath}`);
        console.log(`Total entries: ${Object.keys(dictionary).length}`);
    });

}).on('error', (err) => {
    console.error('Error downloading:', err);
});
