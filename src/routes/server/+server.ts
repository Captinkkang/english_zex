import { json, type RequestHandler } from '@sveltejs/kit';
import * as cheerio from 'cheerio';

export const GET: RequestHandler = async ({ url }) => {
    const type = url.searchParams.get('type');

    if (type === '1') {
        try {
            const randomPage = Math.floor(Math.random() * 50) + 1;
            const listUrl = `https://arca.live/b/bluearchive?category=%EC%A7%A4&p=${randomPage}`;

            // [핵심] 실제 브라우저와 동일한 헤더 구성
            const commonHeaders = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
                'Referer': 'https://arca.live/',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1'
            };

            const listRes = await fetch(listUrl, { headers: commonHeaders });
            const listHtml = await listRes.text();

            // Cloudflare 챌린지 페이지인지 확인
            if (listHtml.includes('Just a moment...') || listHtml.includes('challenge-platform')) {
                console.error("Cloudflare에 의해 차단됨 (Challenge Page)");
                return json({ error: '브라우저 보안 확인에 걸렸습니다. 잠시 후 다시 시도해주세요.' }, { status: 403 });
            }

            const $list = cheerio.load(listHtml);
            const articleLinks: string[] = [];

            // 모바일/반응형 구조(.vrow)에 맞게 추출
            $list('a.vrow').each((_, el) => {
                const $el = $list(el);
                const href = $el.attr('href');
                const isNotice = $el.hasClass('notice') || $el.closest('.notice-board').length > 0;

                if (!isNotice && href && href.startsWith('/b/bluearchive/')) {
                    // URL 파라미터(?p=1 등) 제거하고 순수 게시글 주소만 추출
                    const cleanHref = href.split('?')[0];
                    articleLinks.push(`https://arca.live${cleanHref}`);
                }
            });

            if (articleLinks.length === 0) throw new Error('게시글을 찾을 수 없습니다.');

            const randomPostUrl = articleLinks[Math.floor(Math.random() * articleLinks.length)];
            
            // 상세 페이지 호출 시에도 동일 헤더 사용
            const postRes = await fetch(randomPostUrl, { headers: commonHeaders });
            const postHtml = await postRes.text();
            const $post = cheerio.load(postHtml);

            // 이미지 추출 로직
            let imageUrl = $post('.article-content img').first().attr('src');
            if (!imageUrl) {
                imageUrl = $post('meta[property="og:image"]').attr('content');
            }

            if (!imageUrl) throw new Error('이미지를 찾을 수 없습니다.');
            if (imageUrl.startsWith('//')) imageUrl = 'https:' + imageUrl;

            return json({ imageUrl, postUrl: randomPostUrl });

        } catch (error: any) {
            console.error("Fetch Error:", error.message);
            return json({ error: error.message }, { status: 500 });
        }
    }

    // type 2, 3 로직
    const targetMap: Record<string, string> = { '2': 'https://www.google.com', '3': 'https://github.com' };
    const targetUrl = targetMap[type ?? ''];

    if (!targetUrl) return json({ error: '잘못된 타입' }, { status: 400 });

    try {
        const response = await fetch(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/123.0.0.0' }
        });
        const data = await response.text();
        return new Response(data, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    } catch (error) {
        return json({ error: '실패' }, { status: 500 });
    }
};