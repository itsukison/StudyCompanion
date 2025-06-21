"use client";

import React, {useEffect, useState} from 'react'
import {usePathname, useRouter, useSearchParams} from "next/navigation";
import Image from 'next/image'
import {formUrlQuery, removeKeysFromUrlQuery} from "@jsmastery/utils";


const SearchInput = () => {
    // stores the current page address without query parameters
    const pathname = usePathname();
    const router = useRouter();
    // retrieves the query parameters from the URL
    const searchParams = useSearchParams();
    // tries to find if there's a topic mentioned in the address
    const query = searchParams?.get("topic") || "";

    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            // If searchQuery has a value, update the URL with the new topic
            if (searchQuery) {
                const newUrl = formUrlQuery({
                    params: searchParams.toString(),
                    key: "topic",
                    value: searchQuery
                });

                router.push(newUrl, {scroll: false});
            } else { 
                // If searchQuery is empty and the current path is /companions,
                // remove the topic from the URL
                if (pathname === "/companions") {
                    const newUrl = removeKeysFromUrlQuery({
                        params: searchParams.toString(),
                        keysToRemove: ["topic"]
                    });
                    router.push(newUrl, {scroll: false});
                }
            }

        }, 800)

        // Cleanup function: this will be called when the component unmounts
        // or before the effect runs again.
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, router, searchParams, pathname, query]) // Added query to dependencies

    return (
        <div className="relative border border-black rounded-lg items-center flex gap-2 px-2 py-1 h-fit">
            <Image src="/icons/search.svg" alt="search" width={15} height={15} />
            <input
                placeholder="Search companions..."
                className="outline-none"
                value={searchQuery}
                // onChange: Event handler that triggers when the input's value changes.
                // It calls `setSearchQuery` to update the `searchQuery` state
                // with the new value from the input field (e.target.value).
                onChange={(e) => setSearchQuery(e.target.value)}
                />
        </div>
    )
}
export default SearchInput
