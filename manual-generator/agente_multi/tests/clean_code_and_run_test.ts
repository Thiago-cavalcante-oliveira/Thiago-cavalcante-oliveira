import * as fs from 'fs/promises';
import * as path from 'path';

async function main() {
    const crawlerAgentPath = path.join(__dirname, '../agents/CrawlerAgent.ts');
    let crawlerAgentContent = await fs.readFile(crawlerAgentPath, 'utf-8');

    crawlerAgentContent = crawlerAgentContent.replace('./util/detection.js', './util/detection');
    crawlerAgentContent = crawlerAgentContent.replace('./interaction.js', './interaction');

    await fs.writeFile(crawlerAgentPath, crawlerAgentContent);

    const crawlerTypesPath = path.join(__dirname, '../agents/interfaces/CrawlerTypes.ts');
    let crawlerTypesContent = await fs.readFile(crawlerTypesPath, 'utf-8');

    crawlerTypesContent = crawlerTypesContent.replace('import { DetectionConfig } from \'../../config/detection-strategies.js\';', '');

    await fs.writeFile(crawlerTypesPath, crawlerTypesContent);

    const detectionUtilPath = path.join(__dirname, '../agents/util/detection.ts');
    let detectionUtilContent = await fs.readFile(detectionUtilPath, 'utf-8');

    detectionUtilContent = detectionUtilContent.replace('../../config/detection-strategies.js', '../../config/detection-strategies');
    detectionUtilContent = detectionUtilContent.replace('../interfaces/CrawlerTypes.js', '../interfaces/CrawlerTypes');

    await fs.writeFile(detectionUtilPath, detectionUtilContent);
}

main();