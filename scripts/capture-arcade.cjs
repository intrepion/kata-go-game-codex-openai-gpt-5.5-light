'use strict';
const {chromium}=require('playwright');const {mkdir,readFile,writeFile}=require('node:fs/promises');const {createHash}=require('node:crypto');const path=require('node:path');
(async()=>{const output=process.env.CAPTURE_OUTPUT||'/tmp/go-captures',site=process.env.CAPTURE_SITE||'capture-site';await mkdir(output,{recursive:true});const inputs={};for(const f of ['index.html','styles.css','game.js'])inputs[f]=createHash('sha256').update(await readFile(path.join(site,f))).digest('hex');const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:1280,height:1000},deviceScaleFactor:1,locale:'en-US',reducedMotion:'reduce'});await page.goto('http://127.0.0.1:4180/',{waitUntil:'domcontentloaded'});
 const board=page.locator('#board');const rect=await board.boundingBox();if(!rect)throw Error('Go board not visible');
 async function play(x,y){await board.click({position:{x:(44+x*84)*rect.width/760,y:(44+y*84)*rect.height/760}})}
 for(const [x,y] of [[2,2],[6,6],[6,2],[2,6],[4,4],[3,3]])await play(x,y);
 await page.locator('main.app-shell').screenshot({path:path.join(output,'go-01.png'),animations:'disabled'});
 for(const [x,y] of [[5,3],[3,5],[5,5],[2,4],[4,2],[6,4]])await play(x,y);
 await page.locator('main.app-shell').screenshot({path:path.join(output,'go-02.png'),animations:'disabled'});
 await writeFile(path.join(output,'capture.json'),JSON.stringify({schemaVersion:1,workflowCommit:process.env.GITHUB_SHA||null,sourceCommit:process.env.GAME_SOURCE_COMMIT||null,runId:process.env.GITHUB_RUN_ID||null,url:'http://127.0.0.1:4180/',inputs,browser:browser.version(),viewport:{width:1280,height:1000},screenshots:['go-01.png','go-02.png']},null,2)+'\n');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
