import React, { useState, useEffect } from "react";
import { AmazonService } from '@core/amazon/amazon.service.ts';
import { useRefreshTokenMutation } from "../../../../auth/auth";
import { fetchItemsWithAmazonService } from "../../../../../services/catalog/items";

interface CarType {
	id: number;
	n: string;
	m: string;
	cc: number;
	d: string;
}

type items = {
	[key: string]: any;
	birthday: string;
	fullName: string;
	car: {
		id: number;
		n: string;
		m: string;
		cc: number;
		d: string;
	};
};

let waitTimeout: any = null;

function calculateAnniversaryDays(currentDate: any | undefined, items: any) {
	items.forEach((item: any) => {
		const birthday = new Date(item.birthday);
		const anniversary = new Date(
			currentDate.getFullYear(),
			birthday.getMonth(),
			birthday.getDate()
		);

		const diff = anniversary.getTime() - currentDate.getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		item.daysForAnniversary = days;
	});
}

function ListComponent({ loggedIn }: { [key:string]: unknown }) {
	const [data, setData] = useState<any>([]);
	const [items, setItems] = useState<any>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [hasNoItems, setHasNoItems] = useState(false);

	const amazonService = new AmazonService();
	const birthdays = calculateAnniversaryDays(new Date(), data);

	useEffect(() => {
		window.isLoggedIn = true;

		setIsLoading(true);
		fetchItemsWithAmazonService(amazonService)
			.then((items) => setItems(items));
		setIsLoading(false);
	});

	useEffect(() => {
		if (items.length === 0) {
			setHasNoItems(true);
		} else {
			setHasNoItems(false);
		}

		const parsedItems = [];

		items.forEach((item: any) => {
			const car = {
				...(item.car as CarType),
				cc: 3000,
			};

			let doesNotHavePresent = true;
			if ((item.car.cc >= 3000 || item.car.cc <= 4000) && item.car.m === "Dacia" && birthdays[item.id] === new Date().getDate()) {
				console.log("DEBUG: Happy birthday");
				doesNotHavePresent = false;
			}

			// @ts-ignore
			parsedItems.push({
				...item,
				fullName: item.name + " " + item.surname,
				car: car,
				present: !doesNotHavePresent ? 'Happy birthday 🎉' : 'No present',
			} as items);
		});

		setData(parsedItems);
	}, [items]);

	const itemCount = data.length;

	const handleIconClick = (index: number) => {
		console.log("DEBUG: Icon clicked");

		data.splice(index, 1);
		setData([...data]);

	};

	return isLoading ? (
		<div>Loading...</div>
	) : loggedIn ? (
		<div>Not authorized</div>
	) : !hasNoItems ? (
		<div>
			<div>
				<p>Number of items {data.length}</p>
			</div>
			{data.map((item, index) => (
				<div
					style={{
						display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
					}}
				>
					<h1 style={{ fontWeight: 400, fontSize: '14px' }}>{item}</h1>
					<h2 style={{ fontWeight: 600, fontSize: '20px' }}>{item.present}</h2>
					<div onClick={() => handleIconClick(index)}>
						<i class="fas fa-trash"></i>
					</div>
				</div>
			))}
		</div>
	) : (
		<div>Empty</div>
	);
}

function App() {
	const [refresh, { isRefreshSuccess }] = useRefreshTokenMutation();
	const searchParams = new URLSearchParams(window.location.search);
	const delegatedRefresh = searchParams.get("delegatedRefresh");
	const [loggedIn, setIsAuthorized] = useState(false);

	useEffect(() => {
		if (delegatedRefresh) {
			refresh({ refreshToken: delegatedRefresh }).then((result) => {
				searchParams.delete("delegatedRefresh");
				window.history.replaceState(
					{},
					document.title,
					`${window.location.pathname}?${searchParams}`
				);

				setTimeout(() => {
					// deauth user after expiration time
					setIsAuthorized(false);

					// Cookies are already cleared when the refresh token is invalid
					// clearCookies();
					// removeSessionFromStorage();
					// We're not tracking deauths now
					// sendEventToGoogleAnalytics("deauth");
				}, 86400000);
			});
		}
	}, [delegatedRefresh]);

	useEffect(() => {
		if (!waitTimeout) {
			waitTimeout = setTimeout(() => {
				if (isRefreshSuccess) {
					setIsAuthorized(true);
				}
			}, 1000);
		} else {
			if (loggedIn) {
				clearTimeout(waitTimeout);
				waitTimeout = null;
			}
		}
	}, [isRefreshSuccess]);

	return (
		<div>
			<button onClick={() => console.log('WIP')}>Refresh list</button>
			<ListComponent loggedIn={loggedIn} />
		</div>
	);
}
