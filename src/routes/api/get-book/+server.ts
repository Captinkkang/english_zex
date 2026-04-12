import { json } from '@sveltejs/kit';
import clientPromise from '$lib/server/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { id, pw } = await request.json();
        const client = await clientPromise;
        const db = client.db('word_app'); // 여기서 DB 이름을 강제로 지정합니다.
        const collection = db.collection('personal_books');

        const book = await collection.findOne({ userId: id });

        if (book) {
            // 비번 확인 (별도의 복잡한 암호화 없이 요청하신 대로 단순 비교)
            if (book.userPw !== pw) {
                return json({ message: '비밀번호가 일치하지 않습니다.' }, { status: 401 });
            }
            return json({ words: book.words });
        } else {
            // 아이디가 없으면 신규 유저로 간주하고 빈 배열 반환
            return json({ words: [], isNew: true });
        }
    } catch (e) {
        return json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
};