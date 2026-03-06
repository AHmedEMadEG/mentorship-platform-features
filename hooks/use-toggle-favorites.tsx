'use client';

import { useAuth } from '@/contexts/auth-context';
import { addToWishlist, removeFromWishlist } from '@/firebase/userServices';
import { useEffect, useState } from 'react';
import { toast } from './use-toast';

export function useToggleFavorites() {
	const { user, setUser } = useAuth();

	const [favorites, setFavorites] = useState<string[]>([]);
	const [wishlistLoginModalOpen, setWishlistLoginModalOpen] = useState(false);

	useEffect(() => {
		if (user && user.wishlist) {
			setFavorites(user.wishlist);
		} else {
			setFavorites([]);
		}
	}, [user]);

	const toggleFavorite = async (productId: string) => {
		if (!user) {
			setWishlistLoginModalOpen(true);
			return;
		}

		const wasFavorite = favorites.includes(productId);
		const newFavorites = wasFavorite ? favorites.filter((id) => id !== productId) : [...favorites, productId];

		setFavorites(newFavorites);
		setUser({ ...user, wishlist: newFavorites });

		try {
			if (wasFavorite) {
				await removeFromWishlist(user.uid, productId);
			} else {
				await addToWishlist(user.uid, productId);
			}
		} catch (error) {
			setFavorites(favorites);
			setUser({ ...user, wishlist: favorites });
			toast.error(
				'Error',
				`Error ${wasFavorite ? 'removing' : 'adding'} product ${wasFavorite ? 'from' : 'to'} your wishlist: ${error}`
			);
		}
	};
	return { favorites, toggleFavorite, wishlistLoginModalOpen, setWishlistLoginModalOpen };
}
