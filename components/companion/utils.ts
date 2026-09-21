export function parseFullName(name: string): { prefix: 'นาย' | 'นาง' | 'นางสาว'; rawName: string } {
  const trimmed = name.trim();
  if (trimmed.startsWith('นางสาว')) {
    return { prefix: 'นางสาว', rawName: trimmed.replace(/^นางสาว\s*/, '') };
  }
  if (trimmed.startsWith('นาง')) {
    return { prefix: 'นาง', rawName: trimmed.replace(/^นาง\s*/, '') };
  }
  if (trimmed.startsWith('นาย')) {
    return { prefix: 'นาย', rawName: trimmed.replace(/^นาย\s*/, '') };
  }
  if (trimmed.startsWith('คุณ')) {
    return { prefix: 'นาย', rawName: trimmed.replace(/^คุณ\s*/, '') };
  }
  return { prefix: 'นาย', rawName: trimmed };
}
