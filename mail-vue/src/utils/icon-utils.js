import {getExtName} from "@/utils/file-utils.js";

/**
 * 附件图标：统一线性图标语言（Lucide），仅用颜色区分文件类型。
 * 尺寸固定 20px，保证列表与正文中的视觉重量一致。
 */
const SIZE = '20px'

const FILE_ICON = {
    archive: {icon: 'lucide:file-archive', color: 'var(--cm-warning)'},
    image: {icon: 'lucide:image', color: '#2f9e6f'},
    video: {icon: 'lucide:file-video', color: '#7c6cf0'},
    audio: {icon: 'lucide:file-audio', color: '#d4514b'},
    text: {icon: 'lucide:file-text', color: 'var(--cm-text-2)'},
    word: {icon: 'lucide:file-text', color: '#2b6cb0'},
    sheet: {icon: 'lucide:file-spreadsheet', color: '#2f9e6f'},
    slides: {icon: 'lucide:file-presentation', color: '#c96442'},
    pdf: {icon: 'lucide:file', color: '#d4514b'},
    other: {icon: 'lucide:paperclip', color: 'var(--cm-text-3)'}
}

export function getIconByName(filename) {
    const ext = getExtName(filename)
    let type = 'other'
    if (['zip', 'rar', '7z', 'tar', 'tgz'].includes(ext)) type = 'archive'
    else if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'jfif', 'svg'].includes(ext)) type = 'image'
    else if (['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv'].includes(ext)) type = 'video'
    else if (['mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a'].includes(ext)) type = 'audio'
    else if (['txt', 'md', 'ini', 'conf', 'log'].includes(ext)) type = 'text'
    else if (['doc', 'docx'].includes(ext)) type = 'word'
    else if (['xls', 'csv', 'xlsx'].includes(ext)) type = 'sheet'
    else if (['ppt', 'pptx', 'pps', 'potx', 'pot'].includes(ext)) type = 'slides'
    else if (ext === 'pdf') type = 'pdf'

    const conf = FILE_ICON[type]
    return {icon: conf.icon, width: SIZE, height: SIZE, color: conf.color}
}
