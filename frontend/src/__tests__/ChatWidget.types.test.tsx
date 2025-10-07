import ChatWidget from '@/components/common/chat/chat-widget';

describe('ChatWidget types', () => {
  it('rejects unused props', () => {
    // @ts-expect-error ChatWidget does not accept messages or onSend props
    <ChatWidget messages={[]} onSend={() => {}} />;
  });
});
