import type { Post } from '../services/catalogService';

interface PostCardProps {
  post: Post;
  onSelect: (id: string) => void;
}

export const PostCard = ({ post, onSelect }: PostCardProps) => {
  const modelName = post.title.replace('Experiencia con ', '');
  const primaryContent = post.modelContents?.[0];
  const mediaSrc = post.coverPhotoUrl || primaryContent?.contentUrl || '';
  const isPrimaryVideo = primaryContent?.contentType === 'VIDEO' && primaryContent.contentUrl === mediaSrc;

  return (
    <div 
      onClick={() => onSelect(post.id)}
      className="relative z-10 flex items-center w-full bg-gradient-to-br from-white to-slate-50 dark:from-[#012a33] dark:to-[#012a33] rounded-[3rem] p-6 cursor-pointer shadow-[0_20px_50px_rgba(15,23,42,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:shadow-[0_24px_70px_rgba(15,23,42,0.14)] dark:hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)] hover:scale-[1.01] transition-all duration-300 group border border-slate-200 dark:border-white/5"
    >
      <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-[6px] border-[#FD0083] overflow-hidden flex-shrink-0 shadow-md group-hover:border-[#00BCD4] transition-colors duration-500">
        {isPrimaryVideo ? (
          <video
            src={mediaSrc}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            muted
            autoPlay
            loop
            playsInline
          />
        ) : (
          <img
            src={mediaSrc}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            alt={modelName}
          />
        )}
      </div>
      
      <div className="ml-8 text-left flex-1">
        <div className="flex items-center gap-4 mb-2">
          <h3 className="text-[#00BCD4] font-black text-3xl md:text-4xl uppercase italic tracking-tighter leading-none">
            {modelName}
          </h3>
          {post.hasPremium && (
            <span className="bg-[#FD0083] text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-md tracking-wider">
              PREMIUM
            </span>
          )}
          <span className="text-slate-900 dark:text-white font-black text-xl ml-auto bg-slate-100 dark:bg-white/5 px-5 py-2 rounded-2xl transition-colors border border-slate-200 dark:border-white/10">
            ${post.price.amount} <span className="text-xs opacity-60">{post.price.currency}</span>
          </span>
        </div>
        
        <p className="text-slate-600 dark:text-white/60 font-medium text-lg max-w-4xl leading-snug line-clamp-2 transition-colors">
          {post.description}
        </p>

        <div className="mt-4 flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
          <span className="text-slate-500 dark:text-[#00BCD4]/80 font-bold text-xs uppercase tracking-[0.2em] transition-colors">
            Disponible ahora
          </span>
        </div>
      </div>
    </div>
  );
};