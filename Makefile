docs:
	find public/editor/components -name "*.js" | xargs docco
	find public/editor/models -name "*.js" | xargs docco
	find public/editor/lib -name "*.js" | xargs docco
	md2html API.md > docs/API.html

clean:
	rm -rf docs
