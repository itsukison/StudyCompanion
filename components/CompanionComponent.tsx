"use client";

import React from "react";
import { getSubjectColor, cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { vapi } from "@/lib/vapi.sdk";
import type { AssistantOverrides } from "@vapi-ai/web/dist/api";
import Image from "next/image";
import Lottie from "lottie-react";
import { useRef } from "react";
import { LottieRefCurrentProps } from "lottie-react";
import soundwaves from "@/constants/soundwaves.json";
import { configureAssistant } from "@/lib/utils";
import { addToSessionHistory } from "@/lib/action/companion.actions";


interface CompanionComponentProps {
  companionId: string;
  subject: string;
  name: string;
  topic: string;
  userName: string;
  userImage: string;
  voice: string;
  style?: string;
}

// This defines a set of named constants, like a list of allowed options for call status.
enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

const CompanionComponent = ({
  companionId,
  subject,
  name,
  topic,
  userName,
  userImage,
  voice,
  style,
}: CompanionComponentProps) => {
  // specifies that callStatus can only be one of the values in the CallStatus enum
  // the initial value is set to INACTIVE
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [isSpeaking, setIsSpeaking] = useState(false); // State to track if the companion is currently speaking
  const [isMuted, setIsMuted] = useState(false); // State to track if the microphone is muted
  const lottieRef = useRef<LottieRefCurrentProps>(null); // Reference for the Lottie animation
  const [messages, setMessages] = useState<SavedMessage[]>([]);

  useEffect(() => {
    if (lottieRef) {
      // check if lottieRef is not null
      if (isSpeaking) {
        // if the companion is speaking, play the animation
        lottieRef.current?.play();
      } else {
        // if the companion is not speaking, stop the animation
        lottieRef.current?.stop();
      }
    }
  }, [isSpeaking, lottieRef]); // effect runs when isSpeaking or lottieRef changes

  useEffect(() => {
    const onCallStart = () => setCallStatus(CallStatus.ACTIVE); // set call status to ACTIVE when a call starts
    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED); // set call status to FINISHED when a call ends
      addToSessionHistory(companionId)
    };
    const onMessage = (message: Message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };
        setMessages((prev) => [newMessage, ...prev]);
      }
    }; // handle incoming messages
    const onSpeechStart = () => setIsSpeaking(true); // set isSpeaking to true when speech starts
    const onSpeechEnd = () => setIsSpeaking(false); // set isSpeaking to false when speech ends
    const onError = (error: Error) => console.log("Error", error);

    // whenever smth happens with vapi, we call the functions to update the status
    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("error", onError);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);

    return () => {
      // Cleanup function to remove event listeners
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("error", onError);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
    };
  }, []);

  const toggleMicrophone = () => {
    const isMuted = vapi.isMuted(); // set the current state (true or false) of the mic to isMuted
    vapi.setMuted(!isMuted); // switch it to the opposite state
    setIsMuted(!isMuted); // update the state of the component
  };

  const handleCall = async () => {
    // Function to handle starting a call
    setCallStatus(CallStatus.CONNECTING); // set call status to CONNECTING
    const assistantOverrides = {
      // create an object for assistant overrides
      variableValues: {
        // define the variables for the assistant
        subject,
        topic,
        style,
      },
      clientMessages: ["transcript"],
      serverMessages: [],
    };
    // @ts-expect-error
    vapi.start(configureAssistant(voice, style), assistantOverrides);
  };

  const handleDisconnect = () => {
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
  };

  return (
    <section className="flex flex-col h-[70vh]">
      <section className="flex gap-8 max-sm:flex-col">
        <div className="companion-section">
          <div
            className="companion-avatar"
            style={{ backgroundColor: getSubjectColor(subject) }}
          >
            <div
              className={cn(
                "absolute transition-opacity duration-1000",
                callStatus === CallStatus.FINISHED ||
                  callStatus === CallStatus.INACTIVE
                  ? "opacity-1001"
                  : "opacity-0",
                callStatus === CallStatus.CONNECTING &&
                  "opacity-100 animate-pulse"
              )}
            >
              <Image
                src={`/icons/${subject}.svg`}
                alt={subject}
                width={150}
                height={150}
                className="max-sm:w-fit"
              />
            </div>
            <div
              className={cn(
                "absolute transition-opacity duration-1000",
                callStatus === CallStatus.ACTIVE ? "opacity-100" : "opacity-0"
              )}
            >
              <Lottie
                lottieRef={lottieRef}
                animationData={soundwaves}
                autoplay={false}
                className="companion-lottie"
              />
            </div>
          </div>
          <p className="font-bold text-2xl">{name}</p>
        </div>
        <div className="user-section">
          <div className="user-avatar">
            <Image
              src={userImage}
              alt="user"
              width={130}
              height={130}
              className="rounded-lg"
            />
            <p className="font-bold text-2xl">{userName}</p>
          </div>
          <button className="btn-mic" onClick={toggleMicrophone} disabled={callStatus !== CallStatus.ACTIVE}>
            <Image
              src={isMuted ? "/icons/mic-off.svg" : "/icons/mic-on.svg"}
              alt="mic"
              width={36}
              height={36}
            />
            <p className="max-sm:hidden">
              {isMuted ? "Turn on your mic" : "Turn off your mic"}
            </p>
          </button>
          <button
            className={cn(
              "rounded-lg py-2 cursor-pointer transition-colors w-full text-white",
              callStatus === CallStatus.ACTIVE ? "bg-red-700" : "bg-primary",
              callStatus === CallStatus.CONNECTING && "animate-pulse"
            )}
            onClick={
              callStatus === CallStatus.ACTIVE ? handleDisconnect : handleCall
            }
          >
            {callStatus === CallStatus.ACTIVE
              ? "End Session"
              : callStatus === CallStatus.CONNECTING
              ? "Connecting..."
              : "Start Session"}
          </button>
        </div>
      </section>
      <section className="transcript ml-3">
        <div className="transcript-message no-scrollbar">
          {messages.map((message, index) => {
            if (message.role === "assistant") {
              return (
                <p key={index} className="max-sm:text-sm">
                  {name.split(" ")[0].replace("/[.,]/g", "")} :{" "}
                  {message.content}
                </p>
              );
            } else {
              return (
                <p
                  key={index}
                  className="text-primary max-sm:text-sm"
                >
                  {userName} : {message.content}
                </p>
              );
            }
          })}
        </div>
        <div className="transcript-fade" />
      </section>
    </section>
  );
};

export default CompanionComponent;
