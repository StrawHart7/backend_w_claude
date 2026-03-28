const mutler = require('multer')
const path = require('path')

const storage = mutler.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
        const originalName = path.basename(file.originalname, path.extname(file.originalname))
        const extension = path.extname(file.originalname)
        const uniqueName = `${originalName}_${Date.now()}${extension}`
        cb(null, uniqueName)
    }
})

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error('Type de format non supporté'), false)
    }
}

const upload = mutler({
    storage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024
    }
})

module.exports = upload