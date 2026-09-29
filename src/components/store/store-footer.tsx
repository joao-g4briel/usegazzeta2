import Link from "next/link";
import { AtSign, MessageCircle } from "lucide-react";
import { Wordmark } from "@/components/shared/wordmark";
import type { StoreInfo } from "@/services/store-service";

function waLink(number: string) {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits.startsWith("55") ? digits : `55${digits}`}`;
}

export function StoreFooter({ store }: { store: StoreInfo }) {
  return (
    <footer className="mt-auto border-t border-hairline bg-cream">
      <div className="mx-auto grid max-w-[1320px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Wordmark tone="olive" />
          <p className="max-w-xs text-sm leading-relaxed text-stone-ink">
            Moda, make & perfume para você{" "}
            <span className="font-script text-[1.5rem] leading-none text-gold-ink">brilhar</span>
          </p>
          <div className="flex gap-2">
            {store.whatsapp ? (
              <a
                href={waLink(store.whatsapp)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex size-10 items-center justify-center rounded-full bg-paper text-olive shadow-soft hover:bg-sage-mist"
                aria-label="Fale conosco no WhatsApp"
              >
                <MessageCircle className="size-[1.1rem]" />
              </a>
            ) : null}
            {store.instagram ? (
              <a
                href={`https://instagram.com/${store.instagram.replace("@", "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex size-10 items-center justify-center rounded-full bg-paper text-olive shadow-soft hover:bg-sage-mist"
                aria-label="Instagram da Use Gazzeta"
              >
                <AtSign className="size-[1.1rem]" />
              </a>
            ) : null}
          </div>
        </div>
        <nav aria-label="Categorias" className="space-y-3 text-sm">
          <p className="text-xs font-bold tracking-[0.14em] text-olive uppercase">Comprar</p>
          <Link href="/categoria/roupas" className="block text-ink hover:text-olive">Roupas</Link>
          <Link href="/categoria/maquiagens" className="block text-ink hover:text-olive">Maquiagens</Link>
          <Link href="/categoria/perfumes" className="block text-ink hover:text-olive">Perfumes</Link>
          <Link href="/categoria/acessorios" className="block text-ink hover:text-olive">Acessórios</Link>
          <Link href="/produtos?filtro=ofertas" className="block text-ink hover:text-olive">Ofertas</Link>
        </nav>
        <nav aria-label="Ajuda" className="space-y-3 text-sm">
          <p className="text-xs font-bold tracking-[0.14em] text-olive uppercase">Ajuda</p>
          <Link href="/conta" className="block text-ink hover:text-olive">Acompanhar pedido</Link>
          <Link href="/carrinho" className="block text-ink hover:text-olive">Minha sacola</Link>
          <Link href="/favoritos" className="block text-ink hover:text-olive">Favoritos</Link>
        </nav>
        <div className="space-y-3 text-sm">
          <p className="text-xs font-bold tracking-[0.14em] text-olive uppercase">Loja</p>
          {store.address ? <p className="text-ink">{store.address}</p> : null}
          {store.email ? (
            <a href={`mailto:${store.email}`} className="block text-ink hover:text-olive">
              {store.email}
            </a>
          ) : null}
          <p className="text-stone-ink">Pagamento por Pix ou cartão de crédito.</p>
        </div>
      </div>
      <div className="border-t border-hairline">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-stone-ink sm:px-6">
          <p>
            © {new Date().getFullYear()} {store.name}. Todos os direitos reservados.
            {process.env.NEXT_PUBLIC_DEMO_DATA !== "false" ? (
              <span className="ml-2 text-stone-ink/90">Catálogo e preços de demonstração.</span>
            ) : null}
          </p>
          <Link href="/login" className="hover:text-olive">Acesso da equipe</Link>
        </div>
      </div>
    </footer>
  );
}
