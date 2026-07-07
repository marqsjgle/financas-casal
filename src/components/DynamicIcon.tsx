import React from 'react';
import * as LucideIcons from 'lucide-react';

export function DynamicIcon({ name, ...props }: { name?: string; [key: string]: any }) {
  if (!name) return <LucideIcons.HelpCircle {...props} />;
  
  // Format the name from snake_case or whatever to PascalCase if needed,
  // but let's assume the DB stores it as 'ShoppingCart' or 'Coffee', etc.
  // In lucide-react, component names are PascalCase.
  
  // Example: if stored as 'coffee', we capitalize it.
  const toPascalCase = (str: string) => str.replace(/(^\w|-\w)/g, (clearAndDir) => clearAndDir.replace(/-/, '').toUpperCase());
  const pascalName = toPascalCase(name);

  const IconComponent = (LucideIcons as any)[pascalName] || (LucideIcons as any)[name];

  if (!IconComponent) {
    return <LucideIcons.HelpCircle {...props} />;
  }

  return <IconComponent {...props} />;
}
