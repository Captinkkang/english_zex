import { MongoClient } from 'mongodb';
import { env } from '$env/dynamic/private';

const MONGODB_URI = env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('정의되지 않은 MONGODB_URI 환경변수입니다. .env 파일을 확인해주세요.');
}

const client = new MongoClient(MONGODB_URI);
const clientPromise = client.connect();

export default clientPromise;