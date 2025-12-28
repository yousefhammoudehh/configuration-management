import './Card.css'
import { FC, ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

interface CardComponent extends FC<CardProps> {
  Title: typeof CardTitle
  Content: typeof CardContent
}

interface CardTitleProps {
  children: ReactNode
}

interface CardContentProps {
  children: ReactNode
}

const CardBase: FC<CardProps> = ({ children, className = '' }) => {
  return <div className={`card ${className}`}>{children}</div>
}

export const CardTitle = ({ children }: CardTitleProps) => {
  return <h3 className="card-title">{children}</h3>
}

export const CardContent = ({ children }: CardContentProps) => {
  return <div className="card-content">{children}</div>
}

export const Card: CardComponent = Object.assign(CardBase, {
  Title: CardTitle,
  Content: CardContent,
})
