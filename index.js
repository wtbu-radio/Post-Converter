/* Where all the post files are stored. Set to how it should be, 
   assuming this is used as a submodule from the root directory of a Jekyll site. */
const postsDirectory = '../_posts'

// For Node.js
const TurndownService = require('turndown')
const turndownService = new TurndownService()
const fs = require('fs');

const allPosts = fs.readdirSync(postsDirectory)

const logstream = fs.createWriteStream("convertlog.txt", {flags:'a'});
logstream.write(`${new Date().toISOString()}\n`)

let convertBannerImage = (bannerString) => {
    if (bannerString.startsWith('  _bu_banner') && bannerString.includes("image") && bannerString.includes("http")) {
        let imagesrcStart = bannerString.substring(bannerString.indexOf("http"))
        let imageSrc = imagesrcStart.substring(0, imagesrcStart.indexOf('"'))
        return imageSrc;
    }
    return "";
}

let isCleanFrontmatter = frontmatterLine => {
    return (frontmatterLine.startsWith('layout') ||
        frontmatterLine.startsWith('title') ||
        frontmatterLine.startsWith('categories') ||
        frontmatterLine.startsWith('tags') ||
        frontmatterLine.startsWith('-') ||
        frontmatterLine.startsWith('author') ||
        frontmatterLine.startsWith('  login') ||
        frontmatterLine.startsWith('  email') ||
        frontmatterLine.startsWith('  display_name') ||
        frontmatterLine.startsWith('  first_name') ||
        frontmatterLine.startsWith('  last_name') ||
        frontmatterLine.startsWith('image') ||
        frontmatterLine.startsWith('  src') ||
        frontmatterLine.startsWith('  alt'))
}

let isGoodFrontmatter = frontmatterLine => {
    return ( isCleanFrontmatter(frontmatterLine) ||
        frontmatterLine.startsWith('meta:') ||
        frontmatterLine.startsWith('  _bu_banner') )
}

let convertFromImport = allPosts => {

    let posts = allPosts.filter(filename => {
        return filename.endsWith(".html")
    })

    for (let i = 0; i < posts.length; i++) {
        let contents = fs.readFileSync(`${postsDirectory}/${posts[i]}`)
        console.log(`${postsDirectory}/${posts[i]}...`)

        let contentString = contents.toString()
        let contentSplit = contentString.split('---')
    
        let frontmatter = contentSplit[1].split('\n')
        //console.log(frontmatter)
        let betterFrontmatter = []
        for (let j = 0; j < frontmatter.length; j++) {
            if (isGoodFrontmatter(frontmatter[j])) {
                betterFrontmatter.push(frontmatter[j])
            }
        }
    
        contentSplit[1] = betterFrontmatter.join('\n') + '\n'
        //Changing content to markdown
        contentSplit[2] = turndownService.turndown(contentSplit[2])
    
        let result = contentSplit.join('---\n')
        console.log(result)
        console.log(`_posts/${posts[i]}`.split('.')[0] + '.md' + ' is done!')
        //fs.writeFileSync(`_posts/${posts[i]}`.split('.')[0] + '.md', result)
    
    }
}

let fixPostImages = allPosts => {

    let posts = allPosts.filter(filename => {
        return filename.endsWith(".md")
    })

    for (let i = 100; i < 110; i++) {
        let contents = fs.readFileSync(`${postsDirectory}/${posts[i]}`)

        let contentString = contents.toString()
        let contentSplit = contentString.split('---')

        // check if frontmatter has an image src set
        if (contentSplit[1].includes('  src: ')) {
            console.log('Skipping ${postsDirectory}/${posts[i]}-- Has image set!')
        } else {
            let frontmatter = contentSplit[1].split('\n')
            //console.log(frontmatter)
            //Check frontmatter for image in banner
            let betterFrontmatter = []
            let imagesrc
            for (let j = 0; j < frontmatter.length; j++) {
                if (convertBannerImage(frontmatter[j])){
                    imagesrc = convertBannerImage(frontmatter[j])
                }
                if (isCleanFrontmatter(frontmatter[j])) {
                    betterFrontmatter.push(frontmatter[j])
                }
            }

            //From markdown, checking for image
            let postContent = contentSplit[2].split('\n')

            for(let j = 0; !imagesrc && j < postContent.length; j++){
                if (postContent[j] && postContent[j].includes('![')) {
                    imagesrcStart = postContent[j].substring( postContent[j].indexOf('{{') )
                    imagesrc = imagesrcStart.substring(0, imagesrcStart.indexOf(')'))
                    postContent.splice(j, 2) //remove the image's line & the newline after it.
                }
            }

            contentSplit[2] = postContent.join('\n')

            if(imagesrc){
                betterFrontmatter.push("image:")
                betterFrontmatter.push(`  src: ${imagesrc}`)
                betterFrontmatter.push(`  alt: post lead image`)
                
                //console.log("image:")
                //console.log(`  src: ${imagesrc}`)
                //console.log(`  alt: post lead image`)

                contentSplit[1] = betterFrontmatter.join('\n') + '\n'

                let result = contentSplit.join('---\n')
                console.log(result)
                console.log(`${postsDirectory}/${posts[i]} has been corrected!`)
            } else {
                console.log(`${postsDirectory}/${posts[i]} requires HUMAN FIXING, writing to doc.`)
                logstream.write(`Manual image fixing: ${postsDirectory}/${posts[i]}\n`)
            }

        }
    }
}

let fixAuthors = allPosts => {
    console.log('stub')
}

convertFromImport(allPosts)
fixPostImages(allPosts)
console.log('Done!')