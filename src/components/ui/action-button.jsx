import { Button } from "./button"

const ACTION_STYLES = {
  edit: {
    base: "bg-blue-500 text-white hover:bg-blue-600",
    icon: "text-white"
  },
  view: {
    base: "bg-green-500 text-white hover:bg-green-600", 
    icon: "text-white"
  },
  delete: {
    base: "bg-red-500 text-white hover:bg-red-600",
    icon: "text-white"
  },
  cancel: {
    base: "bg-red-500 text-white hover:bg-red-600",
    icon: "text-white"
  },  clear: {
    base: "bg-gray-500 text-white hover:bg-gray-600",
    icon: "text-white"
  },
  export: {
    base: "bg-green-500 text-white hover:bg-green-600",
    icon: "text-white"
  },
  primary: {
    base: "bg-blue-600 text-white hover:bg-blue-700",
    icon: "text-white"
  },
  secondary: {
    base: "bg-gray-500 text-white hover:bg-gray-600",
    icon: "text-white"
  }
}

export function ActionButton({ 
  action = "primary", 
  children, 
  className = "", 
  size = "sm",
  variant = "default",
  ...props 
}){
  const actionStyle = ACTION_STYLES[action] || ACTION_STYLES.primary
  
  return (
    <Button
      size={size}
      variant={variant}
      className={`${actionStyle.base} ${className}`}
      {...props}
    >
      {children}
    </Button>
  )
}

// Componentes específicos para acciones comunes
export function EditButton({ children, ...props }) {
  return (
    <ActionButton action="edit" {...props}>
      {children}
    </ActionButton>
  )
}

export function ViewButton({ children, ...props }) {
  return (
    <ActionButton action="view" {...props}>
      {children}
    </ActionButton>
  )
}

export function DeleteButton({ children, ...props }) {
  return (
    <ActionButton action="delete" {...props}>
      {children}
    </ActionButton>
  )
}

export function CancelButton({ children, ...props }) {
  return (
    <ActionButton action="cancel" {...props}>
      {children}
    </ActionButton>
  )
}

export function ClearButton({ children, ...props }) {
  return (
    <ActionButton action="clear" {...props}>
      {children}
    </ActionButton>
  )
}

export function ExportButton({ children, ...props }) {
  return (
    <ActionButton action="export" {...props}>
      {children}
    </ActionButton>
  )
}
