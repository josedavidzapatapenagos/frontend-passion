import type { Post } from '../services/catalogService';

interface PostCardProps {
  post: Post;
  onSelect: (id: string) => void;
}

export const PostCard = ({ post, onSelect }: PostCardProps) => {
  const modelName = post.title.replace('Experiencia con ', '');

  return (
    <div 
      onClick={() => onSelect(post.id)}
      // Ajuste: Redondeado más elegante (3xl), padding optimizado y borde sutil
      className="relative z-10 flex items-center w-full bg-white dark:bg-[#012a33] rounded-[3rem] p-6 cursor-pointer shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)] hover:scale-[1.01] transition-all duration-300 group border border-gray-100 dark:border-white/5"
    >
      {/* Foto Circular: Reducimos un poco el tamaño y el borde para que no compita tanto */}
      <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-[6px] border-[#FD0083] overflow-hidden flex-shrink-0 shadow-md group-hover:border-[#00BCD4] transition-colors duration-500">
        <img 
          src={post.coverPhotoUrl} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          alt={modelName} 
        />
      </div>
      
      {/* Contenido: Ajuste de márgenes y tamaños de fuente */}
      <div className="ml-8 text-left flex-1">
        <div className="flex items-center gap-4 mb-2">
          {/* Tamaño de fuente más equilibrado (3xl o 4xl) */}
          <h3 className="text-[#00BCD4] font-black text-3xl md:text-4xl uppercase italic tracking-tighter leading-none">
            {modelName}
          </h3>
          {post.hasPremium && (
            <span className="bg-[#FD0083] text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-md tracking-wider">
              PREMIUM
            </span>
          )}
          {/* Precio más estilizado */}
          <span className="text-[#012a33] dark:text-white font-black text-xl ml-auto bg-gray-50 dark:bg-white/5 px-5 py-2 rounded-2xl transition-colors">
            ${post.price.amount} <span className="text-xs opacity-60">{post.price.currency}</span>
          </span>
        </div>
        
        {/* Descripción: Reducimos el tamaño de fuente (xl) para legibilidad */}
        <p className="text-[#012a33]/70 dark:text-white/60 font-medium text-lg max-w-4xl leading-snug line-clamp-2 transition-colors">
          {post.description}
        </p>

        {/* Status bar */}
        <div className="mt-4 flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
          <span className="text-[#012a33]/60 dark:text-[#00BCD4]/80 font-bold text-xs uppercase tracking-[0.2em] transition-colors">
            Disponible ahora
          </span>
        </div>
      </div>
    </div>
  );
};