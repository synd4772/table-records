
import {Link} from '@/i18n/routing';

//@ts-ignore
export default function Home({ params: { lang } }) {
   return(
    <div>
        
        <Link href="/documents">documents</Link>
    </div>
   );
}

