import { Client, IMessage, StompSubscription } from "@stomp/stompjs";

// WTS 대시보드는 한 화면에서 여러 패널이 동시에 여러 종목/토픽을 구독해야 하는데,
// 기존처럼 훅마다 @stomp/stompjs Client를 따로 만들면 연결이 화면당 5~8개로 늘어난다.
// 그래서 앱 전체가 STOMP 연결 하나를 공유하고, destination별 구독자 수를 세어(ref-count)
// 마지막 구독자가 떠날 때만 실제 STOMP 구독을 해제하는 매니저를 둔다.
const WS_URL = process.env.NEXT_PUBLIC_WS_URL;

type Listener = (message: IMessage) => void;

let client: Client | null = null;
let connected = false;
const listenersByDestination = new Map<string, Set<Listener>>();
const subscriptionsByDestination = new Map<string, StompSubscription>();

function getClient(): Client {
  if (client) return client;

  // 쿠키(ACCESS_TOKEN)는 WebSocket 핸드셰이크 요청에 브라우저가 자동으로 실어 보내므로
  // 별도 인증 헤더를 붙일 필요가 없다. (기존 use-watchlist.ts/use-quote-history.ts와 동일)
  client = new Client({ brokerURL: WS_URL, reconnectDelay: 5000 });

  client.onConnect = () => {
    connected = true;
    for (const destination of listenersByDestination.keys()) {
      subscribeUpstream(destination);
    }
  };

  client.onWebSocketClose = () => {
    connected = false;
    // 연결이 끊기면 stompjs가 들고 있던 구독 핸들도 함께 무효화된다 — 재연결 시
    // onConnect에서 현재 리스너가 남아있는 destination을 모두 다시 구독한다.
    subscriptionsByDestination.clear();
  };

  client.activate();
  return client;
}

function subscribeUpstream(destination: string) {
  if (subscriptionsByDestination.has(destination)) return;
  const subscription = getClient().subscribe(destination, (message) => {
    listenersByDestination.get(destination)?.forEach((listener) => listener(message));
  });
  subscriptionsByDestination.set(destination, subscription);
}

export function subscribeTopic(destination: string, listener: Listener): () => void {
  const listeners = listenersByDestination.get(destination) ?? new Set<Listener>();
  listeners.add(listener);
  listenersByDestination.set(destination, listeners);

  if (connected) subscribeUpstream(destination);
  else getClient(); // 아직 연결 전이면 onConnect에서 일괄 구독된다.

  return () => {
    const current = listenersByDestination.get(destination);
    if (!current) return;
    current.delete(listener);
    if (current.size > 0) return;

    listenersByDestination.delete(destination);
    subscriptionsByDestination.get(destination)?.unsubscribe();
    subscriptionsByDestination.delete(destination);
  };
}
