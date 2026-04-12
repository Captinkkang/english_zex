import { json } from '@sveltejs/kit';
import clientPromise from '$lib/server/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { id, pw, words } = await request.json();
        const client = await clientPromise;
        const db = client.db('word_app');
        const collection = db.collection('personal_books');

        // upsert: true -> 해당 ID가 없으면 새로 생성, 있으면 업데이트
        await collection.updateOne(
            { userId: id },
            { 
                $set: { 
                    userId: id, 
                    userPw: pw, 
                    words: words 
                } 
            },
            { upsert: true }
        );

        return json({ success: true });
    } catch (e) {
        return json({ message: '저장 중 오류가 발생했습니다.' }, { status: 500 });
    }
};