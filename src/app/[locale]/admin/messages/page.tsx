import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { markMessageHandled } from "@/actions/admin";
import { AdminHeader, Pill } from "@/components/admin/table";

export default async function AdminMessagesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  const [messages, subscribers] = await Promise.all([
    prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="flex flex-col gap-14">
      <section>
        <AdminHeader title={dict.admin.messages} />

        {messages.length ? (
          <ul className="flex flex-col gap-4">
            {messages.map((message) => (
              <li
                key={message.id}
                className="border border-line p-5"
                data-handled={message.handled ? "" : undefined}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{message.subject}</p>
                    <p className="mt-1 text-xs text-content-faint">
                      {message.name} ·{" "}
                      <span dir="ltr">{message.email}</span> ·{" "}
                      <span className="nums">
                        {formatDateTime(message.createdAt, locale)}
                      </span>
                    </p>
                  </div>

                  <form action={markMessageHandled}>
                    <input type="hidden" name="id" value={message.id} />
                    <input type="hidden" name="locale" value={locale} />
                    <button type="submit">
                      <Pill tone={message.handled ? "accent" : "muted"}>
                        {message.handled ? dict.common.yes : dict.common.no}
                      </Pill>
                    </button>
                  </form>
                </div>

                <p className="mt-4 leading-relaxed whitespace-pre-line text-content-muted">
                  {message.body}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="border border-line px-6 py-14 text-center text-content-faint">
            {dict.admin.noItems}
          </p>
        )}
      </section>

      <section>
        <AdminHeader title={dict.admin.newsletter} />
        {subscribers.length ? (
          <ul className="flex flex-wrap gap-2">
            {subscribers.map((subscriber) => (
              <li
                key={subscriber.id}
                className="border border-line px-3 py-1.5 text-xs text-content-muted"
                dir="ltr"
              >
                {subscriber.email}
              </li>
            ))}
          </ul>
        ) : (
          <p className="border border-line px-6 py-10 text-center text-content-faint">
            {dict.admin.noItems}
          </p>
        )}
      </section>
    </div>
  );
}
