import fs from 'node:fs';
import fsPromises  from 'node:fs/promises';
import path from 'node:path';

const fileManager = [
    {
        readDirExt: async(dir, ext)=>{
            try{
                const file = await fsPromises.readdir(dir)
                const textFile = file.filter(e => { return path.extname(e) == ext})

                await fsPromises.mkdir('copiasAprendendo', {
                        recursive: true
                    })

                for(let x = 0; x < textFile.length; x++){
                    let currentFile = [
                        `./aprendendo/${textFile[x]}`,
                        `./copiasAprendendo/${textFile[x]}`
                    ];

                    await fsPromises.copyFile(currentFile[0], currentFile[1])
                    console.log(`Arquivo ${x} copiado com sucesso!`)
                }
                
            } catch (err){
                console.log(`Erro na leitura: ${ err }`)
            }
        }
    }, 
    
    {
        moreInfos: async (file)=>{
            const list = await fsPromises.readdir(file);
            const listFile = list.filter(e => { return path.extname(e) == '.txt' })
            console.log(listFile);
            
            for(const e of listFile){
                let completeDir = `./aprendendo/${e}`
                let status = await fsPromises.stat(completeDir)
                let sliptObj = status.birthtime.toLocaleDateString();
                console.log(sliptObj);
            }
        }
    },

    {
        createFile: async (dir, qtd)=>{
            try{
                for(let x = 0; x < qtd; x ++){
                    let nameNewFile = `${dir}/copia${x}.txt`;
                    await fsPromises.writeFile(nameNewFile,"Exemplo exemplificado");
                }
            } catch (err){
                console.log(err);
            }
        }
    },

    {
        removeFile: async (dir)=>{
            try{
                const setFiles = await fsPromises.readdir(dir);
                const cleanFiles = setFiles.filter(e => path.extname(e) == '.txt');
                
                for(const files of cleanFiles){
                    let nameFile = `${dir}/${files}`;
                    await fsPromises.unlink(nameFile)
                }
            } catch (err){
                console.log(`Erro na leitura: ${err}`);
            }
        }
    },

    {
        deleteRm: async (dir)=>{
            try{
                await fsPromises.rm(dir, {
                    recursive: true
                });
            } catch (err){
                console.log(`Erro: ${err}`)
            }
        }
    },

    {
        renameFunc: async (dir, newDir)=>{
            try{
                await fsPromises.mkdir('./testando', {
                    recursive: true
                })
                await fsPromises.rename(dir, newDir);
            } catch (err){
                console.log(`Erro: ${err}`)
            }
        }
    }
];

// await fileManager.at(-1).renameFunc('./aprendendo/image.jpg', './testando/image.jpg')



async function readStream_rename(dir){
    try{
        const stream = await fs.createReadStream(dir);
        stream.on('error', (err)=>{ console.log(`Erro: ${err}`); });
        stream.on('end', ()=>{ console.log(`Arquivo lido!`); });

        await fsPromises.rename(dir, 'C:/Users/rodri/Downloads/video_inteligente.mp4')
        console.log('Arquivo movido com sucesso!')
    } catch (err){
        console.log(`Erro: ${err}`);
    }
}

// readStream_rename('./testando/inteligente.mp4');



async function createAndWrite(content, dirFile){
    try{
        await fsPromises.mkdir(`./${dirFile}`, {recursive: true });

        const stream = await fs.createReadStream(content);
        const writeFile = await fs.createWriteStream('./testando/renacho.mp4');

        // Primeira forma de passar valores para o createWriteStream
        /*
        stream.on('data', (chunk)=>{
            writeFile.write(chunk);
        })
        stream.on('end', ()=>{
            writeFile.end();
            console.log('Arquivo lido completamente');
        })

        writeFile.on('close', ()=>{
            writeFile.end();
        })
        */

        // Segunda forma de passar valores para o createWriteStream
        stream.pipe(writeFile);
        console.log('Arquivo escrito!');
    } catch (err){
        console.log(err);
    }
}

// createAndWrite('C:/Users/rodri/Videos/renacho.mp4', './testando')