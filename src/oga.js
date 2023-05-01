import axios from "axios";
import ffmpeg from 'fluent-ffmpeg'
import installer from '@ffmpeg-installer/ffmpeg'
import { createWriteStream } from 'fs'
import { dirname, resolve} from 'path'
import { fileURLToPath } from 'url'
import { removeFile } from "./utils.js";

const __dirname = dirname(fileURLToPath(import.meta.url))

class OggConverter {
    constructor() {
        ffmpeg.setFfmpegPath(installer.path)
    }

    async toMp3(input, output) {
        try {
            const outputPath = resolve(dirname(input), `${output}.mp3`)
            return await new Promise((resolve, reject) => {
                ffmpeg(input)
                    .inputOptions('-t 30')
                    .output(outputPath)
                    .on('end', () => {
                        removeFile(input)
                        resolve(outputPath)
                    })
                    .on('error', error => reject(error.message))
                    .run()
            })
        } catch (error) {
            console.error('Error while creating oga', error.message)
        }
    }

    async create(url, filename) {
        try {
            const ogaPath = resolve(__dirname, '../voices', `${filename}.oga`)
            const response = await axios({
                method: 'get',
                url,
                responseType: 'stream',
            })
            return new Promise(resolve => {
            const stream = createWriteStream(ogaPath)
            response.data.pipe(stream)
            stream.on('finish', () => resolve(ogaPath))
            })
        } catch (error) {
            console.error('Error while creating oga', error.message)
        }
    }
}

export const oga = new OggConverter()