/* Requires Playwright and a local Chromium. Source: deterministic motion.js. */
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const fs = require('node:fs/promises');
const path = require('node:path');
const root=path.resolve(__dirname,'..');
const port=Number(process.env.PORT||8080);
const mode=process.argv[2]||'desktop';
const mobile=mode==='mobile';
const width=mobile?1080:1920,height=mobile?1350:1080;
const name=mobile?'asmbl-hero-mobile':'asmbl-hero';
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try {
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    page.on('pageerror',error=>{throw error;});
    await page.goto(`http://127.0.0.1:${port}/export.html?export=1`);
    const ready=await page.evaluate(()=>window.ASMBLMotion.ready);
    if(!ready.ok)throw Error(ready.error);
    const encoder=spawn('ffmpeg',['-hide_banner','-loglevel','warning','-y','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-preset','slow','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart','-threads','4',path.join(root,'assets',`${name}.mp4`)],{stdio:['pipe','inherit','inherit']});
    const result=new Promise((resolve,reject)=>{encoder.on('error',reject);encoder.on('close',code=>code===0?resolve():reject(Error(`ffmpeg exited ${code}`)));});
    for(let frame=0;frame<360;frame++){
      const jpeg=await page.evaluate(t=>{
        window.ASMBLMotion.render(t);
        return document.querySelector('canvas').toDataURL('image/jpeg',.96).split(',')[1];
      },frame/30);
      if(!encoder.stdin.write(Buffer.from(jpeg,'base64')))await once(encoder.stdin,'drain');
      if(frame%60===0)console.log(`${name}: ${frame}/360 frames`);
    }
    encoder.stdin.end(); await result;
    await page.evaluate(()=>window.ASMBLMotion.render(0));
    const poster=await page.evaluate(()=>document.querySelector('canvas').toDataURL('image/webp',.94).split(',')[1]);
    await fs.writeFile(path.join(root,'assets',mobile?'poster-mobile.webp':'poster.webp'),Buffer.from(poster,'base64'));
    console.log(`${name}: 360 frames / 12 s / ${width}×${height}, complete.`);
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
