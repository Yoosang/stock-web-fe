"use client";

import { useEffect, useRef } from "react";
import { subscribeTopic } from "@/lib/stomp-manager";

// 단일 destination을 구독하는 패널(차트, 프로그램매매, 호가창 등)용 훅.
// onMessage를 ref에 담아두고 effect는 destination에만 반응하게 해서, 매 렌더마다
// onMessage가 새로 만들어져도 불필요하게 재구독하지 않는다.
export function useStompTopic<T>(destination: string | null, onMessage: (payload: T) => void) {
  const handlerRef = useRef(onMessage);
  useEffect(() => {
    handlerRef.current = onMessage;
  });

  useEffect(() => {
    if (!destination) return;
    return subscribeTopic(destination, (message) => {
      handlerRef.current(JSON.parse(message.body) as T);
    });
  }, [destination]);
}
