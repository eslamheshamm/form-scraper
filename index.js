const express = require("express");
const app = express();
const puppeteer = require("puppeteer");
const fs = require("fs");
// const GetFilename = (url) => {
// 	if (url) {
// 		var m = url.toString().match(/.*\/(.+?)\./);
// 		if (m && m.length > 1) {
// 			return m[1];
// 		}
// 	}
// 	return "";
// };
const PORT = 8080;
app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}...`);
});
const scrapeForm = async (url) => {
	const launchOptions = {
		// Set viewport size
		defaultViewport: { width: 1920, height: 1080 },
		// Set window size
		args: ["--window-size=1920,1080"],
		// Disable headless mode for debugging
		headless: false,
	};
	const browser = await puppeteer.launch(launchOptions);
	const page = await browser.newPage();
	await page.setViewport({ width: 1440, height: 1080 });
	await page.goto(`${url}`, { waitUntil: "networkidle0" });
	await page.waitForSelector("form", { visible: true });
	const folderName = Buffer.from(`${url}`).toString("base64");

	const formData = await page.evaluate(() => {
		const forms = Array.from(document.querySelectorAll("form")).map(
			(form, index) => {
				const formDta = Array.from(form)
					.map((el) => {
						if (el.type === "hidden") return;
						let element = el.outerHTML;
						let name = el.name;
						let type = el.type;
						let elementType = el.nodeName;
						let width = el.offsetWidth;
						let height = el.offsetHeight;
						let y = el.getBoundingClientRect().top + window.scrollY;
						let x = el.getBoundingClientRect().left + window.scrollX;

						return { element, width, height, y, x, name, type, elementType };
					})
					.filter((e) => e != null);
				return { index, formDta };
			}
		);
		return forms;
	});
	await page.evaluate((_) => {});
	fs.mkdir(`${folderName}`, async () => {
		fs.writeFileSync(
			`./${folderName}/form.json`,
			JSON.stringify(formData, null, 2),
			"utf8"
		);
	});
	const { contentSize } = await page._client.send("Page.getLayoutMetrics");
	const dpr = page._viewport.deviceScaleFactor || 1;
	const maxScreenshotHeight = 1080 / dpr;
	for (let ypos = 0; ypos < contentSize.height; ypos += maxScreenshotHeight) {
		const height = Math.min(contentSize.height - ypos, maxScreenshotHeight);
		await page.screenshot({
			path: `screenshot-@${ypos}px-${folderName}.png`,
			clip: {
				x: 0,
				y: ypos,
				width: contentSize.width,
				height: height,
			},
		});
	}
	// console.log(JSON.stringify(formData, null, 2));
	await browser.close();
};

scrapeForm(`https://tmentors.com/`);
