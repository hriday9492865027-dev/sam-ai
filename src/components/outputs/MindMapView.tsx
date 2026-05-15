export interface MindMapNode {
  root?: string;
  title?: string;
  branches?: MindMapNode[];
  children?: MindMapNode[];
}

const Node = ({ node, depth = 0 }: { node: MindMapNode; depth?: number }) => {
  const label = node.root || node.title || "";
  const kids = node.branches || node.children || [];
  const colors = [
    "from-primary to-primary-glow",
    "from-accent to-primary",
    "from-primary-glow to-accent",
    "from-pink-500 to-primary",
  ];
  const grad = colors[depth % colors.length];

  return (
    <div className="flex items-center">
      <div className={`shrink-0 relative z-10 px-5 py-2.5 rounded-xl bg-gradient-to-r ${grad} shadow-lg text-primary-foreground font-medium text-sm max-w-xs break-words`}>
        {label}
      </div>

      {kids.length > 0 && (
        <div className="flex flex-col ml-12 relative 
          before:content-[''] before:absolute before:-left-12 before:top-1/2 before:w-12 before:h-[3px] before:bg-primary/50 before:-translate-y-1/2">
          
          {kids.map((k, i) => (
            <div key={i} className="relative py-2.5 pl-6
              before:content-[''] before:absolute before:left-0 before:top-1/2 before:w-6 before:h-[3px] before:bg-primary/50 before:-translate-y-1/2 
              after:content-[''] after:absolute after:left-0 after:w-[3px] after:bg-primary/50
              after:top-0 after:bottom-0 
              first:after:top-1/2 
              last:after:bottom-1/2 
              first:last:after:hidden
            ">
              <Node node={k} depth={depth + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const MindMapView = ({ root }: { root: MindMapNode }) => (
  <div className="glass-strong p-6 rounded-xl overflow-x-auto scrollbar-thin">
    <h3 className="font-display text-lg font-semibold mb-6 text-gradient">Mind Map</h3>
    <div className="min-w-max p-2">
      <Node node={root} />
    </div>
  </div>
);
