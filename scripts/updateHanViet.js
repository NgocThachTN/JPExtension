const fs = require('fs');
const path = require('path');
const https = require('https');

const hanVietPath = path.join(__dirname, '../public/dict/hanviet.json');
// URL: Kyujitai (Old) -> Shinjitai (New)
const mappingUrl = 'https://gist.githubusercontent.com/KEINOS/fb660943484008b7f5297bb627e0e1b1/raw/old_to_new_kanjis.json';

// Helper to fetch JSON
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function updateDictionary() {
    try {
        console.log('Loading existing dictionary...');
        if (!fs.existsSync(hanVietPath)) {
            console.error('Han Viet dictionary not found!');
            return;
        }
        const hanVietDict = JSON.parse(fs.readFileSync(hanVietPath, 'utf8'));
        const initialCount = Object.keys(hanVietDict).length;
        console.log(`Current entries: ${initialCount}`);

        console.log('Fetching Kyujitai -> Shinjitai mapping...');
        const oldToNewMap = await fetchJson(mappingUrl);

        console.log('Updating dictionary...');
        let addedCount = 0;

        // Iterate through Old -> New map
        for (const [oldChar, newChar] of Object.entries(oldToNewMap)) {
            // We want to add 'newChar' (Shinjitai) if it's missing
            // using the reading of 'oldChar' (Kyujitai)

            // Note: newChar might be a string of multiple chars if 1-to-many? 
            // The gist description says "maps Kyujitai to Shinjitai". 
            // Let's assume 1-to-1 or check data.
            // If newChar is a string, we treat it as the key to add.

            if (!hanVietDict[newChar] && hanVietDict[oldChar]) {
                hanVietDict[newChar] = hanVietDict[oldChar];
                addedCount++;
                // console.log(`Added ${newChar} -> ${hanVietDict[oldChar]} (from ${oldChar})`);
            }
        }

        console.log(`Added ${addedCount} new entries.`);

        fs.writeFileSync(hanVietPath, JSON.stringify(hanVietDict, null, 2));
        console.log(`Dictionary updated. Total entries: ${Object.keys(hanVietDict).length}`);

    } catch (error) {
        console.error('Error updating dictionary:', error);
    }
}

updateDictionary();
