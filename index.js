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
const scrapeForm = async (url) => {
	const browser = await puppeteer.launch({
		headless: false,
	});
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
	fs.mkdir(`${folderName}`, async () => {
		fs.writeFileSync(
			`./${folderName}/form.json`,
			JSON.stringify(formData, null, 2),
			"utf8"
		);
	});
	const formsSCreen = await page.$$("form");
	for (let i = 0; i < formsSCreen.length; i++) {
		try {
			const boundingBox = await formsSCreen[i].boundingBox();
			// get screenshot of a particular element
			await formsSCreen[i].screenshot({
				path: `./${folderName}/${i}.png`,
				clip: {
					x: boundingBox.x,
					y: boundingBox.y,
					width: Math.min(boundingBox.width, page.viewport().width),
					height: Math.min(boundingBox.height, page.viewport().height),
				},
			});
		} catch (e) {
			// if element is 'not visible', spit out error and continue
			console.log(
				`couldnt take screenshot of element with index: ${i}. cause: `,
				e
			);
		}
	}
	// console.log(JSON.stringify(formData, null, 2));
	await browser.close();
};

scrapeForm(`https://riadeid.net/ask-riad-eid/`);
