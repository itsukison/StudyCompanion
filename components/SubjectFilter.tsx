"use client"

import React from 'react'
import {usePathname, useRouter, useSearchParams} from "next/navigation";
import {useState, useEffect} from "react";
import {formUrlQuery, removeKeysFromUrlQuery} from "@jsmastery/utils";
import Image from "next/image";
import { subjects } from "@/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SubjectFilter = () => {

    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const query = searchParams?.get("subject") || "";
    const [subject, setSubject] = useState(query);

    useEffect(() => {
        let newUrl = "";
        if (subject === "all") {
            newUrl = removeKeysFromUrlQuery({
                params: searchParams.toString(),
                keysToRemove: ["subject"]
            });
        } else {
            newUrl = formUrlQuery({
                // converts the searchParams to a string
                params: searchParams.toString(),
                // specify the key to update
                key: "subject",
                // specify the value you want to assign to the URL
                value: subject
            });
        }
        router.push(newUrl, {scroll: false});
    }, [subject])


    
    return (
        <Select onValueChange={setSubject} value={subject}>
            <SelectTrigger className="input capitalize">
                <SelectValue placeholder="Select the subject" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject} className="capitalize">
                        {subject}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
export default SubjectFilter
