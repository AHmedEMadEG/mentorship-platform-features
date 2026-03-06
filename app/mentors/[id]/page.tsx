'use client';

import MentorShipProfile from '@/components/MentorShipProfile';
import { useParams } from 'next/navigation';

const page = () => {
	const { id } = useParams<{ id: string }>();

	return <MentorShipProfile hasBackToHome={true} id={id} />;
};

export default page;
